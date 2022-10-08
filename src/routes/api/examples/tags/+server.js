import { getTags } from "$lib/api/examples";
import { json } from "@sveltejs/kit";

/** @type {import('@sveltejs/kit').RequestHandler} */
export const GET = async () => {
  try {
    const tags = await getTags();
    return json(tags);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
