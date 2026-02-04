export default async function handleAppointments({ method, pathParameters, body, user, supabase, logger, isAdminUser }) {
    switch (method) {
        case 'GET': {
            try {
                if (!isAdminUser(user)) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
                }

                const { data, error } = await supabase
                    .from('eye_exam_appointments')
                    .select(`*, eye_exam_locations(id, name, address, city, phone)`)
                    .order('appointment_date', { ascending: true });

                if (error) throw error;

                return { statusCode: 200, body: JSON.stringify(data || []) };
            } catch (err) {
                logger && logger.error && logger.error('Error listing appointments', err);
                return { statusCode: 500, body: JSON.stringify({ error: 'Error listing appointments' }) };
            }
        }

        case 'POST': {
            try {
                if (!user) {
                    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
                }

                const { iso, locationId, notes, appointment_date, appointment_time } = body || {};

                let appointmentDate, appointmentTime;
                if (iso) {
                    const dt = new Date(iso);
                    appointmentDate = dt.toISOString().split('T')[0];
                    appointmentTime = dt.toTimeString().split(' ')[0];
                } else if (appointment_date && appointment_time) {
                    appointmentDate = appointment_date;
                    appointmentTime = appointment_time;
                } else if (locationId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'appointment date/time required' }) };
                }

                const userId = user.cognitoId;
                const patientName = user.name || user.email || 'Sin nombre';
                const patientEmail = user.email || null;

                const insert = {
                    user_id: userId,
                    location_id: locationId || null,
                    appointment_date: appointmentDate,
                    appointment_time: appointmentTime,
                    notes: notes || '',
                    status: 'scheduled',
                    patient_name: patientName,
                    patient_email: patientEmail,
                    exam_type: 'routine',
                    duration_minutes: 60,
                };

                const { data, error } = await supabase.from('eye_exam_appointments').insert([insert]).select().single();
                if (error) throw error;

                return { statusCode: 201, body: JSON.stringify(data) };
            } catch (err) {
                logger && logger.error && logger.error('Error creating appointment', err);
                return { statusCode: 500, body: JSON.stringify({ error: 'Error creating appointment' }) };
            }
        }

        case 'PUT': {
            try {
                if (!isAdminUser(user)) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
                }

                const id = pathParameters?.id;
                if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };

                const updates = body || {};
                const { data, error } = await supabase.from('eye_exam_appointments').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify(data) };
            } catch (err) {
                logger && logger.error && logger.error('Error updating appointment', err);
                return { statusCode: 500, body: JSON.stringify({ error: 'Error updating appointment' }) };
            }
        }

        case 'DELETE': {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
        }

        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
};
