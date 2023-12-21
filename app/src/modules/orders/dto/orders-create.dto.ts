export interface Clothes {
  id: number;
  quantity: number;
}

export default class OrdersCreateDto {
  clothes: Clothes[];

  email: string;

  link: string;

  name: string;

  phone: string;

  country: string;

  address: string;

  zipCode: number;

  delivery: number;

  comment: string;
}
