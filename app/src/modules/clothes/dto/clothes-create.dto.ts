import { ClothesInterface } from '../interfaces/clothes.interfaces';

export default class ClothesCreateDto implements ClothesInterface {
  name: string;
  collectionId: number;
  description: string;
  imagePath: string;
  price: number;
}
