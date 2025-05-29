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
  }),
});


export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useAddProductMutation,
  useDeleteProductMutation,
  useUpdateProductMutation,
} = apiSlice;