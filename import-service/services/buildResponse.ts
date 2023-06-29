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
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});