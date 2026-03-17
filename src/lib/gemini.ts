import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with user-provided key
const genAI = new GoogleGenerativeAI('AIzaSyDQr_PA471lisr-KqPYkvCgJTzEC4WHZOQ'); 

export async function getSmartPlacement(roomBase64Url: string, itemCategory: string, itemName: string, currentItems: number): Promise<{ x: number, y: number, scale: number }> {
  try {
    // Determine a reasonable fallback if AI fails depending on category
    const fallbacks = {
      'Sofa': { x: 50, y: 70, scale: 1.2 },
      'Seating': { x: 50, y: 70, scale: 1 },
      'Tables': { x: 50, y: 80, scale: 0.8 },
      'Storage': { x: 80, y: 60, scale: 1.1 },
      'Beds': { x: 50, y: 65, scale: 1.5 },
      'Office': { x: 50, y: 70, scale: 1 },
      'Outdoor': { x: 50, y: 70, scale: 1 }
    };
    const fallback = fallbacks[itemCategory as keyof typeof fallbacks] || { x: 50, y: 50, scale: 1 };
    
    // Add some random offset based on current items so they don't stack directly on top of each other if AI fails or defaults
    const offset = currentItems * 5;
    const defaultResponse = { x: fallback.x + offset, y: fallback.y, scale: fallback.scale };

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Extract base64 data correctly (remove data:image/jpeg;base64, etc.)
    const base64Data = roomBase64Url.split(',')[1];
    const mimeType = roomBase64Url.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)?.[1] || 'image/jpeg';
    
    if (!base64Data) return defaultResponse;

    const prompt = `You are an expert interior designer acting as an autonomous placement engine.
I am providing you with a photo of a room. I want to place a new piece of furniture in it.
The piece of furniture is a: ${itemName} (Category: ${itemCategory}).

Analyze the room photo and determine the absolute best coordinates (percentage-based X and Y, 0-100) and scale (0.5 to 2.0) to place this item.
- X=0 is far left, X=100 is far right.
- Y=0 is top ceiling, Y=100 is bottom floor. Ground items (sofas, tables) usually go in Y=60 to Y=90.
- Scale usually is 1.0 but might be smaller (0.8) if the room is far away or larger if it's placed close to the camera.

You MUST respond ONLY with valid JSON with exactly three keys: "x", "y", "scale". No markdown, no reasoning, just JSON.
Example: {"x": 45, "y": 75, "scale": 1.1}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);

    const text = result.response.text();
    // Clean up potential markdown blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.scale === 'number') {
      return {
        x: Math.max(0, Math.min(100, parsed.x)),
        y: Math.max(0, Math.min(100, parsed.y)),
        scale: Math.max(0.3, Math.min(3, parsed.scale))
      };
    }
    
    return defaultResponse;
  } catch (err) {
    console.error("Gemini AI placement failed, using fallback:", err);
    // If anything fails, use standard sensible placement instead of crashing
    return { x: 50 + (currentItems * 4), y: 70, scale: 1.0 };
  }
}
