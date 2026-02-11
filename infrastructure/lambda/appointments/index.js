/**
 * Appointments Lambda Handler
 * Maneja citas y ubicaciones de exámenes oftalmológicos
 * 
 * Endpoints:
 * - GET    /appointments           - Listar todas las citas (admin)
 * - GET    /appointments/user      - Listar citas del usuario actual
 * - POST   /appointments           - Crear nueva cita
 * - PUT    /appointments/:id       - Actualizar cita (status, etc.)
 * - DELETE /appointments/:id       - Cancelar/eliminar cita
 * - GET    /public/locations       - Listar ubicaciones activas (público)
 * - GET    /locations              - Listar todas las ubicaciones (admin)
 * - POST   /locations              - Crear ubicación (admin)
 * - PUT    /locations/:id          - Actualizar ubicación (admin)
 * - DELETE /locations/:id          - Eliminar ubicación (admin)
 */

const { createClient } = require("@supabase/supabase-js");

// ================================================================
// Configuration
// ================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
  "https://full-vision.vercel.app",
  "https://full-vision-react.vercel.app",
];

// ================================================================
// CORS Helpers
// ================================================================

function getCorsHeaders(origin) {
  // NUNCA usar '*' con Access-Control-Allow-Credentials: true (los navegadores lo rechazan).
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Credentials": "true",
  };
}

function response(statusCode, body, origin) {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

function errorResponse(statusCode, message, origin) {
  return response(statusCode, { error: message }, origin);
}

// ================================================================
// Auth Helpers
// ================================================================

function getUserFromToken(event) {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    // Decodificar JWT (sin verificar - API Gateway ya lo verificó)
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    
    return {
      cognitoId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      groups: payload["cognito:groups"] || [],
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

function isAdmin(user) {
  return user?.groups?.includes("admin") || user?.groups?.includes("Admins");
}

// ================================================================
// Locations Handlers
// ================================================================

async function handleGetPublicLocations(origin) {
  const { data, error } = await supabase
    .from("eye_exam_locations")
    .select("id, name, address, city, phone, email, business_hours")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
    return errorResponse(500, "Error al cargar ubicaciones", origin);
  }

  return response(200, data || [], origin);
}

async function handleGetAllLocations(user, origin) {
  if (!isAdmin(user)) {
    return errorResponse(403, "Acceso denegado", origin);
  }

  const { data, error } = await supabase
    .from("eye_exam_locations")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching all locations:", error);
    return errorResponse(500, "Error al cargar ubicaciones", origin);
  }

  return response(200, data || [], origin);
}

async function handleCreateLocation(user, body, origin) {
  if (!isAdmin(user)) {
    return errorResponse(403, "Acceso denegado", origin);
  }

  const { name, address, city, phone, email, business_hours, is_active } = body;

  if (!name) {
    return errorResponse(400, "El nombre es requerido", origin);
  }

  const { data, error } = await supabase
    .from("eye_exam_locations")
    .insert([{ name, address, city, phone, email, business_hours, is_active: is_active ?? true }])
    .select()
    .single();

  if (error) {
    console.error("Error creating location:", error);
    return errorResponse(500, "Error al crear ubicación", origin);
  }

  return response(201, data, origin);
}

async function handleUpdateLocation(user, locationId, body, origin) {
  if (!isAdmin(user)) {
    return errorResponse(403, "Acceso denegado", origin);
  }

  const { data, error } = await supabase
    .from("eye_exam_locations")
    .update(body)
    .eq("id", locationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating location:", error);
    return errorResponse(500, "Error al actualizar ubicación", origin);
  }

  return response(200, data, origin);
}

async function handleDeleteLocation(user, locationId, origin) {
  if (!isAdmin(user)) {
    return errorResponse(403, "Acceso denegado", origin);
  }

  // Verificar si hay citas asociadas
  const { data: appointments } = await supabase
    .from("eye_exam_appointments")
    .select("id")
    .eq("location_id", locationId)
    .limit(1);

  if (appointments && appointments.length > 0) {
    return errorResponse(400, "No se puede eliminar: hay citas asociadas a esta ubicación", origin);
  }

  const { error } = await supabase
    .from("eye_exam_locations")
    .delete()
    .eq("id", locationId);

  if (error) {
    console.error("Error deleting location:", error);
    return errorResponse(500, "Error al eliminar ubicación", origin);
  }

  return response(204, null, origin);
}

// ================================================================
// Appointments Handlers
// ================================================================

async function handleGetAllAppointments(user, origin) {
  if (!isAdmin(user)) {
    return errorResponse(403, "Acceso denegado", origin);
  }

  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .select(`
      *,
      eye_exam_locations ( id, name, address, city, phone )
    `)
    .order("appointment_date", { ascending: true });

  if (error) {
    console.error("Error fetching appointments:", error);
    return errorResponse(500, "Error al cargar citas", origin);
  }

  return response(200, data || [], origin);
}

async function handleGetUserAppointments(user, origin) {
  if (!user) {
    return errorResponse(401, "Autenticación requerida", origin);
  }

  // Buscar el user_id en profiles usando cognito_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("cognito_id", user.cognitoId)
    .single();

  if (!profile) {
    return response(200, [], origin); // Usuario sin perfil, sin citas
  }

  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .select(`
      *,
      eye_exam_locations ( id, name, address, city, phone )
    `)
    .eq("user_id", profile.id)
    .order("appointment_date", { ascending: true });

  if (error) {
    console.error("Error fetching user appointments:", error);
    return errorResponse(500, "Error al cargar citas", origin);
  }

  return response(200, data || [], origin);
}

async function handleCreateAppointment(user, body, origin) {
  if (!user) {
    return errorResponse(401, "Debes iniciar sesión para agendar una cita", origin);
  }

  const { locationId, iso, notes } = body;

  if (!locationId || !iso) {
    return errorResponse(400, "Ubicación y fecha son requeridas", origin);
  }

  // Buscar el user_id en profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("cognito_id", user.cognitoId)
    .single();

  if (!profile) {
    return errorResponse(400, "Perfil de usuario no encontrado", origin);
  }

  // Parsear fecha y hora del ISO string
  const appointmentDateTime = new Date(iso);
  const appointmentDate = appointmentDateTime.toISOString().split("T")[0];
  const appointmentTime = appointmentDateTime.toTimeString().split(" ")[0];

  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .insert([{
      user_id: profile.id,
      location_id: locationId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: notes || "",
      status: "scheduled",
      patient_name: profile.full_name || user.name || user.email,
      patient_email: profile.email || user.email,
      exam_type: "routine",
      duration_minutes: 60,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    
    const errorMessages = {
      "23503": "La ubicación seleccionada no es válida",
      "42501": "No tienes permisos para crear citas",
    };
    
    return errorResponse(500, errorMessages[error.code] || "Error al crear la cita", origin);
  }

  return response(201, data, origin);
}

async function handleUpdateAppointment(user, appointmentId, body, origin) {
  if (!user) {
    return errorResponse(401, "Autenticación requerida", origin);
  }

  const { status, notes } = body;
  const updates = {};

  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  // Admin puede actualizar cualquier cita
  if (isAdmin(user)) {
    const { data, error } = await supabase
      .from("eye_exam_appointments")
      .update(updates)
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      return errorResponse(500, "Error al actualizar cita", origin);
    }

    return response(200, data, origin);
  }

  // Usuario normal solo puede cancelar sus propias citas
  if (status !== "cancelled") {
    return errorResponse(403, "Solo puedes cancelar tus propias citas", origin);
  }

  // Buscar perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("cognito_id", user.cognitoId)
    .single();

  if (!profile) {
    return errorResponse(403, "Perfil no encontrado", origin);
  }

  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("user_id", profile.id)
    .select()
    .single();

  if (error) {
    console.error("Error cancelling appointment:", error);
    return errorResponse(500, "Error al cancelar cita", origin);
  }

  if (!data) {
    return errorResponse(404, "Cita no encontrada o no tienes permiso", origin);
  }

  return response(200, data, origin);
}

// ================================================================
// Main Handler
// ================================================================

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.rawPath || "";

  console.log(`[Appointments Lambda] ${method} ${path}`);

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(origin),
      body: "",
    };
  }

  try {
    // Parse body if present
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        return errorResponse(400, "Invalid JSON body", origin);
      }
    }

    // Get user from token (may be null for public endpoints)
    const user = getUserFromToken(event);

    // Extract path parameters
    const pathParts = path.split("/").filter(Boolean);
    
    // Route: /public/locations
    if (path.includes("/public/locations")) {
      if (method === "GET") {
        return handleGetPublicLocations(origin);
      }
    }

    // Route: /locations
    if (path.match(/^\/locations(\/|$)/)) {
      const locationId = pathParts[1]; // /locations/:id

      switch (method) {
        case "GET":
          return handleGetAllLocations(user, origin);
        case "POST":
          return handleCreateLocation(user, body, origin);
        case "PUT":
          if (!locationId) return errorResponse(400, "Location ID requerido", origin);
          return handleUpdateLocation(user, locationId, body, origin);
        case "DELETE":
          if (!locationId) return errorResponse(400, "Location ID requerido", origin);
          return handleDeleteLocation(user, locationId, origin);
      }
    }

    // Route: /appointments/user
    if (path.includes("/appointments/user")) {
      if (method === "GET") {
        return handleGetUserAppointments(user, origin);
      }
    }

    // Route: /appointments
    if (path.match(/^\/appointments(\/|$)/)) {
      const appointmentId = pathParts[1]; // /appointments/:id

      switch (method) {
        case "GET":
          return handleGetAllAppointments(user, origin);
        case "POST":
          return handleCreateAppointment(user, body, origin);
        case "PUT":
          if (!appointmentId) return errorResponse(400, "Appointment ID requerido", origin);
          return handleUpdateAppointment(user, appointmentId, body, origin);
      }
    }

    return errorResponse(404, `Ruta no encontrada: ${method} ${path}`, origin);

  } catch (error) {
    console.error("Unhandled error:", error);
    return errorResponse(500, "Error interno del servidor", origin);
  }
};
