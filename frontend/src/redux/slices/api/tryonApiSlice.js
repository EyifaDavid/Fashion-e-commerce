import { apiSlice } from "../apiSlice";

// Virtual try-on. Hits our backend, which calls a free Hugging Face Space.
// [MIGRATION] If the backend later moves to a paid provider, this stays exactly the same.
// Note: fetchBaseQuery sends a FormData body as multipart automatically (no manual headers),
// and the base query already sets credentials:'include' so the auth cookie is sent.
export const tryonApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    tryOn: builder.mutation({
      query: (formData) => ({
        url: "/tryon",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useTryOnMutation } = tryonApiSlice;
