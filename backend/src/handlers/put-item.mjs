// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

//DynamoDB Endpoint
const ENDPOINT_OVERRIDE = process.env.ENDPOINT_OVERRIDE;
let client = undefined;

if (ENDPOINT_OVERRIDE) {
  client = new DynamoDBClient({ endpoint: ENDPOINT_OVERRIDE });
} else {
  client = new DynamoDBClient({}); // Use default values for DynamoDB endpoint
  console.warn(
    "No value for ENDPOINT_OVERRIDE provided for DynamoDB, using default"
  );
}

const dynamo = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = "VisitCountTable";

export const putItemHandler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      case "GET /items/{id}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              id: event.pathParameters.id,
            },
          })
        );
        body = body.Item;
        break;
      case "GET /items":
        body = await dynamo.send(new ScanCommand({ TableName: tableName }));
        body = body.Items;
        break;
      case "PUT /items":
        let requestJSON = JSON.parse(event.body);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: 1,
              count: requestJSON.count,
            },
          })
        );
        body = `Put item count ${requestJSON.count}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }
  return {
    statusCode,
    body,
    headers,
  };
};

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
//  */
// export const putItemHandler = async (event) => {
//     if (event.httpMethod !== 'POST') {
//         throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
//     }
//     // All log statements are written to CloudWatch
//     console.info('received:', event);

//     // Get id and name from the body of the request
//     const body = JSON.parse(event.body);
//     const id = body.id;
//     const name = body.name;

//     // Creates a new item, or replaces an old item with a new item
//     // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
//     var params = {
//         TableName : tableName,
//         Item: { id : id, name: name }
//     };

//     try {
//         const data = await ddbDocClient.send(new PutCommand(params));
//         console.log("Success - item added or updated", data);
//       } catch (err) {
//         console.error("Error adding or updating item:", err.message);
//         console.error("Error code:", err.code);
//         console.error("Error name:", err.name);
//         console.error("Error stack:", err.stack);

//         throw err;
//       }

//     const response = {
//         statusCode: 200,
//         headers: {
//             "Access-Control-Allow-Headers" : "Content-Type",
//             "Access-Control-Allow-Origin": "*", //DO NOT USE THIS VALUE IN PRODUCTION - https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html
//             "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
//         },
//         body: JSON.stringify(body)
//     };

//     // All log statements are written to CloudWatch
//     console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
//     return response;
// };
