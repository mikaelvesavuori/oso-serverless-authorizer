# Oso serverless authorizer

This repository demonstrates a working implementation of [Oso](https://www.osohq.com) in an AWS Lambda context using [TypeScript](https://www.typescriptlang.org), and being deployed with [Serverless Framework](https://www.serverless.com). When deployed, it will first pass the request through an Oso-powered [Lambda authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) on AWS API Gateway, and successful calls will be fed into a very basic function responding with `OK`.

**Note**: Uses and adapts the [same quickstart example as Oso provides](https://docs.osohq.com/node/getting-started/quickstart.html).

## Technical notes

Oso uses proprietary files in the `.polar` format to store the policies it will use.

Assets and files like that tend to cause problems with bundlers, like Webpack, which is incredibly common (and useful) when building web applications.

Despite trying several solutions for a few hours I was unable to get everything working the way you might expect with Webpack, Serverless Framework, and `serverless-offline`.

While other, older Oso examples work just fine, they are unfortunately written in "old-style" Node and are in plain JS rather than TypeScript.

I had to strike a compromise where this solution is able to use TypeScript and Serverless Framework, but in which we will trade away some of the packaging automation. The way this is achieved is by doing the packaging step manually, so that we can be very precise with how we pull in the right materials. Therefore, it does _not_ use the built in packaging from Serverless Framework.

In closing: The particular type of solution provided here would therefore work best in a situation where you can deploy the authorizer (in which we use Oso here) _separately_ from any other application stacks. Else you will have to do some hooking and wiring to not break the regular bundling that you will expect for the other microservices.

## Deploy

First you will have to build the application with `npm run package`.

Deploy the stack with `npm run deploy`.

Copy the URL and use it as below.

## Usage

Call the deployed endpoint as below.

To define your identity and the "requested" use, we will be using the `Authorization` header.

- A combination such as `Authorization: graham#oso` _will_ work.
- However, `Authorization: graham#gmail` _will not_ work.

To better understand the permissions model, see `repositoriesDb` and `usersDb` in `index.ts`, as well as how they relate to the policy defined in `policy.polar`.

## Remove

Run `npm run teardown`.

## References

- [Adding Authorization to a Serverless Node.js App](https://www.osohq.com/post/add-authorization-to-a-serverless-nodejs-app)
- [Quickstart for Node.js](https://docs.osohq.com/node/getting-started/quickstart.html)
