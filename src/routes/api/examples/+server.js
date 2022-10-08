import { getExamples } from "$lib/api/examples";
import { json } from "@sveltejs/kit";

/** @type {import('@sveltejs/kit').RequestHandler} */
export const GET = async ({ url }) => {
  try {
    const tags = url.searchParams.get("tags");
    const tagsArray = tags ? tags.split(",") : null;
    const examples = await getExamples(tagsArray);
    return json(examples);
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
