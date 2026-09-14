export type DrinkIconVariant =
  | 'whiteRussian'
  | 'blackRussian'
  | 'margarita'
  | 'cosmopolitan'
  | 'whiskeySour'
  | 'aperolSpritz'
  | 'tequilaSunrise'
  | 'negroni'
  | 'blueMoon'
  | 'oldFashioned'
  | 'martini'
  | 'gimlet'
  | 'manhattan'
  | 'beer'
  | 'wine'
  | 'sake'
  | 'genericCocktail';

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

export const getDrinkIconVariant = (name: string, type: string): DrinkIconVariant => {
  const normalizedName = name.toLowerCase().trim();
  const normalizedType = type.toLowerCase().trim();

  if (includesAny(normalizedName, ['white russian', 'white_russian', '白俄罗斯'])) {
    return 'whiteRussian';
  }

  if (includesAny(normalizedName, ['black russian', 'black_russian', '黑俄罗斯'])) {
    return 'blackRussian';
  }

  if (includesAny(normalizedName, ['margarita', '玛格丽特'])) {
    return 'margarita';
  }

  if (includesAny(normalizedName, ['cosmopolitan', 'cosmo', '大都会'])) {
    return 'cosmopolitan';
  }

  if (includesAny(normalizedName, ['whiskey sour', 'whisky sour', '威士忌酸'])) {
    return 'whiskeySour';
  }

  if (includesAny(normalizedName, ['aperol', 'spritz', '阿佩罗'])) {
    return 'aperolSpritz';
  }

  if (includesAny(normalizedName, ['tequila sunrise', 'sunrise', '龙舌兰日出'])) {
    return 'tequilaSunrise';
  }

  if (includesAny(normalizedName, ['retro negroni', 'negroni', '内格罗尼'])) {
    return 'negroni';
  }

  if (includesAny(normalizedName, ['blue moon', '蓝月'])) {
    return 'blueMoon';
  }

  if (includesAny(normalizedName, ['old fashioned', '老式'])) {
    return 'oldFashioned';
  }

  if (includesAny(normalizedName, ['martini', '马天尼'])) {
    return 'martini';
  }

  if (includesAny(normalizedName, ['gimlet', '金雷特'])) {
    return 'gimlet';
  }

  if (includesAny(normalizedName, ['manhattan', '曼哈顿'])) {
    return 'manhattan';
  }

  if (normalizedType === 'beer') {
    return 'beer';
  }

  if (normalizedType === 'wine') {
    return 'wine';
  }

  if (normalizedType === 'sake') {
    return 'sake';
  }

  return 'genericCocktail';
};
