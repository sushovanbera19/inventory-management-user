/**
 * The pictures products use in the demo data. Products alternate between these images
 * (first product image 1, next image 2, and so on). Add or change links here to change them all.
 * To give a single product its own photo, add it to PRODUCT_PHOTOS (key = SKU).
 * With a real backend, product photos come from the API's imageUrl instead.
 */
export const PRODUCT_IMAGES = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdV6jnU4h6pmhMfGm-o6X9bziSZCRzZUoKkLuNgba72Q&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROktj9padYXaEIpehMcLiJPZ0hDz8cF6UV_9KNPKn9bA&s=10',
]

/** The first image, for places that need a single picture. */
export const PRODUCT_IMAGE = PRODUCT_IMAGES[0]

export const PRODUCT_PHOTOS = {}