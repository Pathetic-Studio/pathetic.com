// /sanity/lib/write-client.ts
import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
