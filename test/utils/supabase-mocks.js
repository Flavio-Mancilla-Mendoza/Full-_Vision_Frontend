// Small helper factories to create mock supabase instances for tests
// Small helper factories to create mock supabase instances for tests

export function mockProductsWithSku(exists = true) {
    return {
        from: (table) => {
            return {
                select: () => ({
                    eq: async () => ({ data: exists ? [{ id: 'p1' }] : [], error: null })
                })
            };
        }
    };
}

export function mockOrdersInsertSuccess() {
    return {
        from: (table) => {
            if (table === 'orders') {
                return {
                    insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'order1' }, error: null }) }) })
                };
            }
            if (table === 'order_items') {
                return { insert: async () => ({ error: null }) };
            }
            return { select: async () => ({ data: null, error: null }) };
        }
    };
}

export function mockOrdersInsertGeneric() {
    return {
        from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'x' }, error: null }) }) }) })
    };
}

export default { mockProductsWithSku, mockOrdersInsertSuccess, mockOrdersInsertGeneric };
