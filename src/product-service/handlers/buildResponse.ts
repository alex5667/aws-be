export interface BuildResponseType {
  statusCode: number;
  headers: {
    [key: string]: string | boolean;
  };
  body: string;
}
export const buildResponse = <T>(
  statusCode: number,
  body: T
): BuildResponseType => ({
  statusCode: statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  },
  body: JSON.stringify(body),
});
