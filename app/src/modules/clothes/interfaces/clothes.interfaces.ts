export interface ClothesQuery {
  title?: string;
  collectionId?: number;
}

export interface ClothesInterface {
  id?: number;
  name: string;
  collectionId: number;
  description: string;
  imagePath: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}
