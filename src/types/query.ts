export interface Query { 
  operation: string
}

export interface QueryResult { }

/**
 * Basic type for query definitions. Defines the types for operation and result.
 */
export type QueryDefinition = { query: Query, result: QueryResult };

/**
 * Maps operation names to their corresponding query and result types.
 * Enforces uniqueness by operation key.
 * @template T - Array of query definitions
 */
export type OperationMap<T extends readonly QueryDefinition[]> = {
  [Op in T[number]['query']['operation']]: Extract<T[number], { query: { operation: Op } }>;
};

/**
 * Extracts a union type of all possible query types.
 * @template T - Array of query definitions
 */
export type QueryType<T extends readonly QueryDefinition[]> =
  OperationMap<T>[keyof OperationMap<T>]['query'];

/**
 * Resolves the async result type for a given query.
 * @template Q - Query type (must have operation property)
 * @template T - Array of query definitions
 */
export type QueryResultType<
  Q extends Query,
  T extends readonly QueryDefinition[]
> = Q['operation'] extends keyof OperationMap<T>
  ? Promise<OperationMap<T>[Q['operation']]['result']>
  : never;

/**
 * Defines handler functions for each operation.
 * @template T - Array of query definitions
 */
export type OperationHandlers<T extends readonly QueryDefinition[]> = {
  [Op in keyof OperationMap<T>]: (
    query: OperationMap<T>[Op]['query']
  ) => Promise<OperationMap<T>[Op]['result']>;
};

/**
 * Creates a function that executes the appropriate handler based on the operation field.
 * @template T - Array of query definitions
 * @param handlers - Set of handler functions for each operation
 * @returns Function that executes a query and returns the corresponding result
 */
export function createQueryExecutor<T extends readonly QueryDefinition[]>(
  handlers: OperationHandlers<T>
) {
  return async function execute<Q extends QueryType<T>>(query: Q): Promise<QueryResultType<Q, T>> {
    const { operation } = query;

    const handler = handlers[operation as keyof OperationHandlers<T>];
    if (!handler) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    // Explicit type cast for type safety
    return handler(query as any) as QueryResultType<Q, T>;
  };
}

type Account = {
  id: string;
  name: string;
};

type AccountQueryList = [
  { query: { operation: 'accounts' }, result: Account[] },
  { query: { operation: 'account', id: string }, result: Account }
];

const prismaClient = {
  findManyAccounts: async (): Promise<Account[]> => [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ],
  findAccountById: async (id: string): Promise<Account> => ({
    id,
    name: 'Alice',
  }),
};

const createAccountHandlersFromClient = (
  client: typeof prismaClient
): OperationHandlers<AccountQueryList> => ({
  accounts: async (_query) => client.findManyAccounts(),
  account: async (query) => client.findAccountById(query.id),
});

const handlers = createAccountHandlersFromClient(prismaClient);
const executeQuery = createQueryExecutor<AccountQueryList>(handlers);

async function demo() {
  const result1 = await executeQuery({ operation: 'accounts' });
  console.log(result1);
}
demo();