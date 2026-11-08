/**
 * CC BY 상품 사진의 저작자 표기. `/help` 「사진 출처」가 그린다. 전체 출처·라이선스 기록은 docs/image-credits.md
 */
export type PhotoCredit = {
  camera: string;
  title: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
};

const BY2 = { license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0" };
const BY3 = { license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0" };

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    camera: "펜탁스 MX",
    title: "Pentax MX.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Pentax_MX.jpg",
    author: "Andy Fogg",
    ...BY2,
  },
  {
    camera: "니콘 FM2",
    title: "Sippakorn’sNikonFM2.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sippakorn%E2%80%99sNikonFM2.jpg",
    author: "Sippakorn Yamkasikorn",
    ...BY3,
  },
  {
    camera: "니콘 FM2",
    title: "Sippakorn’sNikonFM2(detail).jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sippakorn%E2%80%99sNikonFM2(detail).jpg",
    author: "Sippakorn Yamkasikorn",
    ...BY3,
  },
  {
    camera: "올림푸스 뮤2",
    title: "Μ(mju-)-II limited edition (3406140791).jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:%CE%9C(mju-)-II_limited_edition_(3406140791).jpg",
    author: "say_cheddar",
    ...BY2,
  },
  {
    camera: "야시카 일렉트로35 GSN",
    title: "Yashica Electro 35 GSN (5179949753).jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Yashica_Electro_35_GSN_(5179949753).jpg",
    author: "E Magnuson",
    ...BY2,
  },
  {
    camera: "야시카 일렉트로35 GSN",
    title: "Yashica Electro 35 GSN (13647958665).jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Yashica_Electro_35_GSN_(13647958665).jpg",
    author: "James Case",
    ...BY2,
  },
];
