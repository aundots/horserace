export type ShopItem = {
  id: string;
  name: string;
  category: "cosmetic" | "consumable" | "limited";
  basePrice: number;
  price: number;
  effect?: string;
};

const demand = new Map<string, number>();

/** 육성·코스메틱 상품 제거 — 티켓은 /shop/buy-ticket 으로만 구매 */
const CATALOG: Omit<ShopItem, "price">[] = [];

export function getShopCatalog(): ShopItem[] {
  return CATALOG.map((item) => {
    const sold = demand.get(item.id) ?? 0;
    const modifier = sold > 10 ? 1.1 : sold < 3 ? 0.95 : 1;
    return {
      ...item,
      price: Math.round(item.basePrice * modifier),
    };
  });
}

export function recordPurchase(itemId: string) {
  demand.set(itemId, (demand.get(itemId) ?? 0) + 1);
}

export function rankedTicketGoldPrice(weekendPurchases: number) {
  const prices = [80, 120, 160, 200];
  return prices[Math.min(weekendPurchases, prices.length - 1)];
}

export type MarketListing = {
  id: string;
  sellerKey: number;
  itemId: string;
  itemName: string;
  price: number;
  createdAt: Date;
};

const listings: MarketListing[] = [];
let listingSeq = 1;

const TRADEABLE = new Set(["palette_blue", "feed_energy", "train_ticket", "tip_fragment"]);

export function canTrade(itemId: string) {
  return TRADEABLE.has(itemId);
}

export function marketList(
  sellerKey: number,
  itemId: string,
  itemName: string,
  price: number,
) {
  if (!canTrade(itemId)) throw new Error("거래할 수 없는 아이템이에요.");
  if (price < 10 || price > 5000) throw new Error("가격은 10~5000 골드예요.");
  const listing: MarketListing = {
    id: `m-${listingSeq++}`,
    sellerKey,
    itemId,
    itemName,
    price,
    createdAt: new Date(),
  };
  listings.push(listing);
  return listing;
}

export function marketBuy(listingId: string, buyerKey: number) {
  const idx = listings.findIndex((l) => l.id === listingId);
  if (idx < 0) throw new Error("매물을 찾을 수 없어요.");
  const listing = listings[idx];
  if (listing.sellerKey === buyerKey) throw new Error("본인 매물은 구매할 수 없어요.");
  listings.splice(idx, 1);
  const fee = Math.round(listing.price * 0.08);
  return { listing, fee, sellerReceives: listing.price - fee };
}

export function getMarketListings() {
  return listings.slice(0, 50);
}

export type TipsMarketPost = {
  id: string;
  raceId: string;
  sellerKey: number;
  text: string;
  price: number;
  hitRate: number;
};

const tipsPosts: TipsMarketPost[] = [];
let tipsSeq = 1;

export function publishTipsMarket(
  sellerKey: number,
  raceId: string,
  text: string,
  price: number,
  hitRate: number,
) {
  if (hitRate < 0.6) throw new Error("적중률 60% 이상만 판매할 수 있어요.");
  if (price < 10 || price > 200) throw new Error("가격은 10~200 골드예요.");
  const post: TipsMarketPost = {
    id: `t-${tipsSeq++}`,
    raceId,
    sellerKey,
    text,
    price,
    hitRate,
  };
  tipsPosts.push(post);
  return post;
}

export function getTipsMarketPosts(raceId: string) {
  return tipsPosts.filter((p) => p.raceId === raceId);
}
