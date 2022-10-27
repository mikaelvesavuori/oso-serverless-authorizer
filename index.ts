import { APIGatewayProxyResult, AuthResponse } from 'aws-lambda';

import { Oso } from 'oso';

/**
 * @description Handler that responds to successful calls.
 */
export async function demoHandler() {
  return {
    statusCode: 200,
    body: JSON.stringify('OK')
  };
}

////////////////
// AUTHORIZER //
////////////////

/**
 * @description Authorizer handler using Oso.
 */
export async function authorizerHandler(event: EventInput): Promise<AuthResponse> {
  try {
    // @ts-ignore
    if (event.httpMethod === 'OPTIONS') return handleCors();

    const [userName, repoName] =
      (event.headers.Authorization && event.headers.Authorization.split('#')) || '';
    const repo = Repository.getByName(repoName);
    const user = User.getCurrentUser(userName);

    await authorize(user, 'read', repo);

    // @ts-ignore
    const sourceIp = event?.requestContext?.identity?.sourceIp;

    return generatePolicy(sourceIp, 'Allow', event.methodArn, '');
  } catch (error: any) {
    console.error(error);

    // @ts-ignore
    const sourceIp = event?.requestContext?.identity?.sourceIp;

    return generatePolicy(sourceIp, 'Deny', event.methodArn, {});
  }
}

/**
 * @description Can the user act on the resource?
 */
async function authorize(user: any, action: any, resource: any) {
  const oso = new Oso();
  oso.registerClass(User);
  oso.registerClass(Repository);
  await oso.loadFiles(['policy.polar']);
  return oso.authorize(user, action, resource);
}

/**
 * @description The `Repository` entity.
 */
class Repository {
  name: string;
  isPublic: boolean;

  constructor(name: string, isPublic = false) {
    this.name = name;
    this.isPublic = isPublic;
  }

  static getByName(name: string) {
    return repositoriesDb[name];
  }
}

/**
 * @description The `Role` entity.
 */
class Role {
  name: string;
  repository: Repository;

  constructor(name: string, repository: Repository) {
    this.name = name;
    this.repository = repository;
  }
}

/**
 * @description The `User` entity.
 */
class User {
  roles: any[];

  constructor(roles: Role[]) {
    this.roles = roles;
  }

  /**
   * @description Load our provided user from the mock database.
   */
  static getCurrentUser(userName: string) {
    return usersDb[userName];
  }
}

/**
 * @description Approximation of loading a repository from a database
 * or other persistence source and returning it as a relevant
 * entity class.
 */
const repositoriesDb: Record<string, any> = {
  gmail: new Repository('gmail'),
  react: new Repository('react', true),
  oso: new Repository('oso')
};

/**
 * @description Approximation of loading a user from a database
 * or other persistence source and returning it as a relevant
 * entity class.
 */
const usersDb: Record<string, any> = {
  larry: new User([new Role('admin', repositoriesDb['gmail'])]),
  anne: new User([new Role('maintainer', repositoriesDb['react'])]),
  graham: new User([new Role('contributor', repositoriesDb['oso'])])
};

///////////////////
// BITS AND BOBS //
///////////////////

/**
 * @description CORS handler.
 */
function handleCors() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      Vary: 'Origin'
    },
    body: JSON.stringify('OK')
  } as APIGatewayProxyResult;
}

/**
 * @description Creates the IAM policy for the response.
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
 */
const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string,
  data: string | Record<string, any>
) => {
  return {
    principalId,
    context: {
      stringKey: JSON.stringify(data)
    },
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };
};

/**
 * @description Very basic approximation of the
 * required parts of the incoming event.
 */
type EventInput = {
  headers: Record<string, string>;
  httpMethod: 'GET' | 'POST' | 'PATCH' | 'OPTIONS';
  methodArn: string;
};
