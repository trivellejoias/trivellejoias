export interface Product {
  id: number
  name: string
  category: 'Anéis' | 'Brincos' | 'Colares' | 'Pulseiras'
  image: string
  description: string
  shortDescription: string
  price: number
}

const products: Array<Product> = [
  {
    id: 1,
    name: 'Anel Solitário Cristal',
    category: 'Anéis',
    image: '/products/anel-solitario.svg',
    description:
      'Anel solitário em aço inoxidável banhado a ouro, cravejado com zircônia central em corte brilhante. Peça atemporal, perfeita para o dia a dia ou ocasiões especiais.',
    shortDescription: 'Aço inoxidável banhado a ouro com zircônia central.',
    price: 129,
  },
  {
    id: 2,
    name: 'Anel Trançado Duo',
    category: 'Anéis',
    image: '/products/anel-trancado.svg',
    description:
      'Duas argolas entrelaçadas em aço inoxidável de alta durabilidade, com acabamento polido espelhado. Um clássico moderno que combina com qualquer produção.',
    shortDescription: 'Design entrelaçado com acabamento espelhado.',
    price: 99,
  },
  {
    id: 3,
    name: 'Brinco Argola Le Petit',
    category: 'Brincos',
    image: '/products/brinco-argola.svg',
    description:
      'Argolas médias em aço inoxidável dourado, leves para uso diário e resistentes à água e ao suor. Não escurecem nem oxidam com o tempo.',
    shortDescription: 'Argolas leves e resistentes à água.',
    price: 89,
  },
  {
    id: 4,
    name: 'Brinco Ponto de Luz',
    category: 'Brincos',
    image: '/products/brinco-ponto-luz.svg',
    description:
      'Brinco delicado com micro zircônia fixado em base de aço inoxidável hipoalergênico. Discreto e brilhante, ideal para compor looks do dia a dia.',
    shortDescription: 'Micro zircônia em base hipoalergênica.',
    price: 69,
  },
  {
    id: 5,
    name: 'Colar Corrente Veneziana',
    category: 'Colares',
    image: '/products/colar-corrente.svg',
    description:
      'Corrente veneziana em aço inoxidável banhado a ouro 18k, fecho reforçado e comprimento ajustável. Não mancha, não escurece e mantém o brilho por anos.',
    shortDescription: 'Corrente veneziana com fecho reforçado.',
    price: 149,
  },
  {
    id: 6,
    name: 'Colar Pingente Gota',
    category: 'Colares',
    image: '/products/colar-pingente.svg',
    description:
      'Colar fino com pingente em formato de gota cravejado, banhado a ouro sobre aço inoxidável. Elegante para uso solo ou em composição com outras peças.',
    shortDescription: 'Pingente em gota cravejado, banhado a ouro.',
    price: 119,
  },
  {
    id: 7,
    name: 'Pulseira Elos Clássica',
    category: 'Pulseiras',
    image: '/products/pulseira-elos.svg',
    description:
      'Pulseira de elos ovais em aço inoxidável dourado, fecho lagosta reforçado. Resistente ao contato com água e ao uso diário sem perder o brilho.',
    shortDescription: 'Elos ovais com fecho lagosta reforçado.',
    price: 109,
  },
  {
    id: 8,
    name: 'Pulseira Charms Trivelle',
    category: 'Pulseiras',
    image: '/products/pulseira-charme.svg',
    description:
      'Pulseira ajustável com charms exclusivos da coleção Trivelle, banhada a ouro sobre aço inoxidável. Combina delicadeza e durabilidade em uma peça só.',
    shortDescription: 'Charms exclusivos em pulseira ajustável.',
    price: 139,
  },
]

export default products
