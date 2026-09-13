import { apiSlice } from "../apiSlice";

const PRODUCT_URL = "/products"

export const productApiSLice = apiSlice.injectEndpoints({
     endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Product'],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Product'],
    }),
    addProduct: builder.mutation({
      query: (productData) => ({
        url: `${PRODUCT_URL}`,
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, productData }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: productData,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
    // [VTON] Admin: (re)generate a product's pre-generated on-model preview(s).
    // The backend responds 202 immediately and generates in the background, so the
    // new image appears on a later refetch (a minute or two later), not in this response.
    generateProductPreview: builder.mutation({
      query: ({ id, force = false }) => ({
        url: `/products/${id}/generate-preview${force ? '?force=true' : ''}`,
        method: 'POST',
      }),
      invalidatesTags: ['Product'],
    }),
    // [VTON] Admin: bulk-generate ALL missing on-model previews across the catalog.
    // Backend responds 202 immediately with a queued count and runs sequentially
    // in the background. Guarded against overlapping runs server-side.
    generateAllProductPreviews: builder.mutation({
      query: () => ({
        url: `${PRODUCT_URL}/bulk-generate-previews`,
        method: 'POST',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});


export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useAddProductMutation,
  useDeleteProductMutation,
  useUpdateProductMutation,
  useGenerateProductPreviewMutation,
  useGenerateAllProductPreviewsMutation,
} = apiSlice;