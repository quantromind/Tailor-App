export const ITEM_PRICES = {
  Pant: 350,
  Shirt: 300,
  Custom: 400,
};

export const calculatePrice = (itemType: keyof typeof ITEM_PRICES): number => {
  return ITEM_PRICES[itemType] || ITEM_PRICES.Custom;
};
