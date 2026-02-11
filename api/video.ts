
export const config = {
  runtime: 'nodejs',
};

// Note: Video generation is moved to client-side for better handling of long-running operations and individual API key selection as required by Veo.
export default async function handler(req: any, res: any) {
  return res.status(200).json({ message: "Veo 3 synthesis is handled directly via Neural Core SDK in the client." });
}
