declare module 'npm:@base44/sdk@0.8.40' {
    export function createClientFromRequest(req: any): {
        auth: {
            me: () => Promise<any | null>;
        };
        entities: Record<string, any>;
        asServiceRole: {
            integrations: {
                Core: {
                    InvokeLLM: (args: {
                        prompt: string;
                        response_json_schema?: Record<string, any>;
                    }) => Promise<any>;
                };
            };
        };
    };
}
