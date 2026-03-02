// Handler para gestión de contenido del sitio (admin)
const { getCorsHeaders } = require('../shared/cors');

function isAdminUser(user) {
  return user && user.groups && (user.groups.includes('Admins') || user.groups.includes('admin'));
}

module.exports = async function handleSiteContent({ method, path, user, supabase, body, logger, normalizedRequest }) {
  const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
  const headers = getCorsHeaders(origin);

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers };
  }

  if (!isAdminUser(user)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers };
  }

  try {
    // GET /admin/site-content — listar todo el contenido
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section')
        .order('sort_order');

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify(data), headers };
    }

    // PUT /admin/site-content/{id} — actualizar contenido
    if (method === 'PUT') {
      const id = extractIdFromPath(path);
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing content ID' }), headers };
      }

      const allowedFields = ['value', 'alt_text', 'metadata', 'is_active', 'sort_order'];
      const updates = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('site_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify(data), headers };
    }

    // POST /admin/site-content/upload — subir imagen
    if (method === 'POST' && path.includes('/upload')) {
      if (!body.fileName || !body.fileData || !body.contentType) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing fileName, fileData (base64), or contentType' }),
          headers,
        };
      }

      const folder = body.folder || 'general';
      const ext = body.fileName.split('.').pop();
      const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      // Decode base64 and upload to Supabase Storage
      const buffer = Buffer.from(body.fileData, 'base64');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-content')
        .upload(storagePath, buffer, {
          contentType: body.contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-content')
        .getPublicUrl(uploadData.path);

      // If contentId provided, also update the content record
      if (body.contentId) {
        const updateFields = { value: publicUrl, updated_at: new Date().toISOString() };
        if (body.altText) updateFields.alt_text = body.altText;

        const { error: updateError } = await supabase
          .from('site_content')
          .update(updateFields)
          .eq('id', body.contentId);

        if (updateError) {
          logger.warn('Image uploaded but failed to update content record:', updateError);
        }
      }

      return { statusCode: 200, body: JSON.stringify({ url: publicUrl, path: uploadData.path }), headers };
    }

    // DELETE /admin/site-content/image — eliminar imagen del storage
    if (method === 'DELETE' && path.includes('/image')) {
      if (!body.imagePath) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing imagePath' }), headers };
      }

      const storagePath = body.imagePath.split('/site-content/')[1];
      if (!storagePath) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image path' }), headers };
      }

      const { error } = await supabase.storage.from('site-content').remove([storagePath]);
      if (error) throw error;

      return { statusCode: 200, body: JSON.stringify({ success: true }), headers };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };

  } catch (error) {
    logger.error('Site content handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
      headers,
    };
  }
};

function extractIdFromPath(path) {
  // /admin/site-content/{id}
  const parts = path.split('/').filter(Boolean);
  // ['admin', 'site-content', '{id}']
  if (parts.length >= 3 && parts[0] === 'admin' && parts[1] === 'site-content') {
    const id = parts[2];
    if (id !== 'upload' && id !== 'image') return id;
  }
  return null;
}
