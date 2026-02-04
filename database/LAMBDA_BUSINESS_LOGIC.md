# Lambda Business Logic - Resumen

## ✅ OPERACIONES QUE LAMBDA YA MANEJA

### 1. **Autenticación y Autorización**

- ✅ Extrae usuario de Cognito JWT
- ✅ Verifica grupos (admin vs customer)
- ✅ Normaliza requests (REST API vs HTTP API v2)

### 2. **Control de Permisos**

#### Productos

```javascript
// Solo admin puede crear/editar/borrar productos
if (!user.groups.includes('admin')) {
  return 403 Forbidden
}
```

#### Órdenes

```javascript
// Admin ve todas las órdenes
// Usuarios solo ven sus propias órdenes
if (!isAdmin) {
  query = query.eq("user_id", user.cognitoId);
}
```

### 3. **Cálculos Automáticos**

#### Descuento de Productos

```javascript
// GET /products - Calcula discount_percentage dinámicamente
discount_percentage = ((base_price - sale_price) / base_price) * 100;
```

✅ No se guarda en DB, se calcula al vuelo

#### Totales de Órdenes

```javascript
// POST /orders - Calcula total_amount en el servidor
total_amount = subtotal + tax_amount + shipping_amount - discount_amount;
```

✅ No confía en el frontend, recalcula en servidor

#### Precios de Items

```javascript
// POST /orders - Calcula unit_price y total_price de cada item
unit_price = product.sale_price || product.base_price;
total_price = unit_price * quantity;
```

✅ Usa precios actuales de la BD, no del frontend

### 4. **Validaciones de Negocio**

#### Validación de Stock

```javascript
// POST /orders - Verifica stock antes de crear orden
if (product.stock_quantity < item.quantity) {
  throw Error("Insufficient stock");
}
```

✅ Previene órdenes con productos sin stock

#### Validación de Productos

```javascript
// POST /orders - Verifica que productos existan
const { data: product } = await supabase.from("products").select("*").eq("id", item.product_id).single();

if (!product) {
  throw Error("Product not found");
}
```

✅ Previene órdenes con productos inexistentes

### 5. **Inyección Automática de Datos**

```javascript
// POST /orders - Añade automáticamente user_id y email
const orderData = {
  ...body,
  user_id: user.cognitoId,
  email: user.email,
  total_amount: calculatedTotal, // Sobreescribe con cálculo servidor
};
```

✅ No confía en datos del frontend

---

## ⚠️ OPERACIONES QUE FALTAN (TODO)

### 1. **Actualización de Stock**

Cuando una orden se confirma, reducir stock:

```javascript
// TODO: Implementar en Lambda
async function reduceStock(orderId) {
  const { data: items } = await supabase.from("order_items").select("product_id, quantity").eq("order_id", orderId);

  for (const item of items) {
    await supabase
      .from("products")
      .update({
        stock_quantity: supabase.raw("stock_quantity - ?", [item.quantity]),
      })
      .eq("id", item.product_id);
  }
}
```

### 2. **Historial de Cambios de Estado**

Cuando cambias el estado de una orden, registrar en `order_status_history`:

```javascript
// TODO: Implementar en Lambda
async function updateOrderStatus(orderId, newStatus, userId, notes) {
  // 1. Obtener estado actual
  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();

  // 2. Actualizar orden
  await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);

  // 3. Registrar en historial
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    changed_by: userId,
    notes: notes,
  });
}
```

### 3. **Soft Deletes**

En lugar de DELETE físico, marcar como eliminado:

```javascript
// TODO: Implementar en Lambda
// En lugar de:
await supabase.from("products").delete().eq("id", id);

// Hacer:
await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id);
```

### 4. **Notificaciones**

Enviar emails cuando cambie estado de orden:

```javascript
// TODO: Implementar con SES
async function notifyOrderStatusChange(orderId, newStatus) {
  const { data: order } = await supabase.from("orders").select("shipping_email, shipping_name, order_number").eq("id", orderId).single();

  // Enviar email con AWS SES
  await sendEmail({
    to: order.shipping_email,
    subject: `Tu pedido ${order.order_number} - ${newStatus}`,
    body: `Hola ${order.shipping_name}, tu pedido cambió a estado: ${newStatus}`,
  });
}
```

---

## 🎯 RESUMEN DE RESPONSABILIDADES

| Operación                | Base de Datos | Lambda | Frontend |
| ------------------------ | ------------- | ------ | -------- |
| Guardar datos            | ✅            | ❌     | ❌       |
| Integridad (FK, UNIQUE)  | ✅            | ❌     | ❌       |
| Índices                  | ✅            | ❌     | ❌       |
| Timestamps automáticos   | ✅            | ❌     | ❌       |
| **Permisos**             | ❌            | ✅     | ❌       |
| **Cálculos**             | ❌            | ✅     | ❌       |
| **Validaciones negocio** | ❌            | ✅     | ❌       |
| **Transformaciones**     | ❌            | ✅     | ❌       |
| **Formateo visual**      | ❌            | ❌     | ✅       |
| **Interacción usuario**  | ❌            | ❌     | ✅       |

---

## 📊 VENTAJAS DE ESTA ARQUITECTURA

✅ **Cambios de reglas = Solo redeploy Lambda**

- No necesitas migraciones de base de datos
- Cálculos y validaciones están en código
- Testing más fácil

✅ **Base de datos simple y rápida**

- Solo guarda datos
- Sin lógica compleja
- Mejor performance

✅ **Seguridad centralizada**

- Lambda verifica TODO
- Frontend no puede manipular precios/permisos
- Un solo punto de control

✅ **Separación de responsabilidades**

- DB = Persistencia
- Lambda = Lógica
- Frontend = UI/UX

---

## 🔧 PRÓXIMOS PASOS RECOMENDADOS

1. ✅ **COMPLETADO:** Cálculo de descuentos
2. ✅ **COMPLETADO:** Validación de stock
3. ✅ **COMPLETADO:** Cálculo de totales
4. ⏳ **PENDIENTE:** Actualización de stock al confirmar orden
5. ⏳ **PENDIENTE:** Historial de cambios de estado
6. ⏳ **PENDIENTE:** Soft deletes
7. ⏳ **PENDIENTE:** Notificaciones por email (SES)
