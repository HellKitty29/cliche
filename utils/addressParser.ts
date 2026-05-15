const DIRECT_CONTROLLED_MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'] as const;

const PROVINCE_TOKENS = [
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',
  '台湾省',
  '内蒙古自治区',
  '广西壮族自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
  '香港特别行政区',
  '澳门特别行政区',
  '北京',
  '上海',
  '天津',
  '重庆',
  '河北',
  '山西',
  '辽宁',
  '吉林',
  '黑龙江',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '海南',
  '四川',
  '贵州',
  '云南',
  '陕西',
  '甘肃',
  '青海',
  '台湾',
  '内蒙古',
  '广西',
  '西藏',
  '宁夏',
  '新疆',
  '香港',
  '澳门',
] as const;

const PROVINCE_CANONICAL_MAP: Record<string, string> = {
  北京: '北京市',
  北京市: '北京市',
  上海: '上海市',
  上海市: '上海市',
  天津: '天津市',
  天津市: '天津市',
  重庆: '重庆市',
  重庆市: '重庆市',
  河北: '河北省',
  河北省: '河北省',
  山西: '山西省',
  山西省: '山西省',
  辽宁: '辽宁省',
  辽宁省: '辽宁省',
  吉林: '吉林省',
  吉林省: '吉林省',
  黑龙江: '黑龙江省',
  黑龙江省: '黑龙江省',
  江苏: '江苏省',
  江苏省: '江苏省',
  浙江: '浙江省',
  浙江省: '浙江省',
  安徽: '安徽省',
  安徽省: '安徽省',
  福建: '福建省',
  福建省: '福建省',
  江西: '江西省',
  江西省: '江西省',
  山东: '山东省',
  山东省: '山东省',
  河南: '河南省',
  河南省: '河南省',
  湖北: '湖北省',
  湖北省: '湖北省',
  湖南: '湖南省',
  湖南省: '湖南省',
  广东: '广东省',
  广东省: '广东省',
  海南: '海南省',
  海南省: '海南省',
  四川: '四川省',
  四川省: '四川省',
  贵州: '贵州省',
  贵州省: '贵州省',
  云南: '云南省',
  云南省: '云南省',
  陕西: '陕西省',
  陕西省: '陕西省',
  甘肃: '甘肃省',
  甘肃省: '甘肃省',
  青海: '青海省',
  青海省: '青海省',
  台湾: '台湾省',
  台湾省: '台湾省',
  内蒙古: '内蒙古自治区',
  内蒙古自治区: '内蒙古自治区',
  广西: '广西壮族自治区',
  广西壮族自治区: '广西壮族自治区',
  西藏: '西藏自治区',
  西藏自治区: '西藏自治区',
  宁夏: '宁夏回族自治区',
  宁夏回族自治区: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  新疆维吾尔自治区: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  香港特别行政区: '香港特别行政区',
  澳门: '澳门特别行政区',
  澳门特别行政区: '澳门特别行政区',
};

export type ParsedChineseAddress = {
  rawInput: string;
  fullAddress: string;
  province: string;
  city: string;
  district: string;
};

function normalizeInput(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function findAddressStart(value: string) {
  let earliestIndex = -1;

  for (const token of PROVINCE_TOKENS) {
    const tokenIndex = value.indexOf(token);
    if (tokenIndex >= 0 && (earliestIndex === -1 || tokenIndex < earliestIndex)) {
      earliestIndex = tokenIndex;
    }
  }

  if (earliestIndex >= 0) {
    return earliestIndex;
  }

  const cityLikeMatch = value.match(/[\u4e00-\u9fa5]{2,}(?:自治州|地区|盟|市)/);
  return cityLikeMatch?.index ?? 0;
}

function canonicalizeProvince(value: string) {
  return PROVINCE_CANONICAL_MAP[value] ?? value;
}

export function parseChineseAddress(input: string): ParsedChineseAddress {
  const normalizedInput = normalizeInput(input);
  const addressStart = findAddressStart(normalizedInput);
  const addressCandidate = normalizedInput.slice(addressStart).trim() || normalizedInput;

  let province = '';
  let city = '';
  let district = '';
  let remainder = addressCandidate;

  const provinceToken = PROVINCE_TOKENS.find((token) => remainder.startsWith(token));
  if (provinceToken) {
    province = canonicalizeProvince(provinceToken);
    remainder = remainder.slice(provinceToken.length).trim();
  } else {
    const looseProvinceMatch = remainder.match(/^[\u4e00-\u9fa5]{2,8}(?:省|自治区|特别行政区|市)/);
    if (looseProvinceMatch) {
      province = canonicalizeProvince(looseProvinceMatch[0]);
      remainder = remainder.slice(looseProvinceMatch[0].length).trim();
    }
  }

  if (province && DIRECT_CONTROLLED_MUNICIPALITIES.includes(province as (typeof DIRECT_CONTROLLED_MUNICIPALITIES)[number])) {
    city = province;
  } else {
    const cityMatch = remainder.match(/^[\u4e00-\u9fa5]{2,}(?:自治州|地区|盟|市)/);
    if (cityMatch) {
      city = cityMatch[0];
      remainder = remainder.slice(cityMatch[0].length).trim();
    }
  }

  const districtMatch = remainder.match(/^[\u4e00-\u9fa5]{1,}(?:自治县|特区|林区|旗|区|县|市)/);
  if (districtMatch) {
    district = districtMatch[0];
  }

  return {
    rawInput: normalizedInput,
    fullAddress: normalizedInput,
    province,
    city,
    district,
  };
}
