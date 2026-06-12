type ReceiptResult = {
  withReceipt(response: Response): Response;
};

export function sessionUpdateResponse(result: ReceiptResult): Response {
  return result.withReceipt(new Response(null, { status: 204 }));
}
