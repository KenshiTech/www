import dotenv from "dotenv";
import { get } from "../env";

dotenv.config();

export const getExamples = async (tags) => {
  const { STRAPI_BASE_URL, STRAPI_API_KEY } = await get();

  let filter = "";
  if (tags?.length) {
    const or = tags.map((t) => `{ value: { eq: "${t}" } }`);
    filter = `(filters: { tags: { or: [${or.join(",")}] }})`;
  }

  const query = `{
      examples${filter} {
        data {
          id
          attributes {
            name
            description
            image {
              data {
                attributes {
                  formats
                }
              }
            }
            url
            source_url
            tags { 
                data {
                    attributes {
                        name
                        value
                        type
                    }
                }
            }
          }
        }
        meta {
          pagination {
            page
            pageSize
            total
            pageCount
          }
        }
      }
    }`;

  const res = await fetch(`${STRAPI_BASE_URL}/graphql`, {
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${STRAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const result = await res.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data.examples.data.map((d) => ({
    id: d.id,
    ...d.attributes,
    description: JSON.parse(d.attributes.description).blocks.map(
      (b) => `${b.data.text}\n\n`
    ),
    image: d.attributes.image.data.attributes.formats.medium.url,
    tags: d.attributes.tags.data.map((t) => t.attributes),
  }));
};

export const getTags = async () => {
  const { STRAPI_BASE_URL, STRAPI_API_KEY } = await get();

  const query = `{
      tags {
        data {
          attributes {
            name
            value
            type
          }
        }
      }
    }`;

  const res = await fetch(`${STRAPI_BASE_URL}/graphql`, {
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${STRAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const result = await res.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data.tags.data.map((d) => ({
    ...d.attributes,
  }));
};
