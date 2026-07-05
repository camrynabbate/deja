export function createCanvasItem(item, index, position = {}) {
  const offset = (index % 5) * 4;
  return {
    item_id: item.id,
    image_url: item.image_url || '',
    title: item.title || '',
    brand: item.brand || '',
    price: item.price || 0,
    x: position.x ?? 28 + offset,
    y: position.y ?? 20 + offset,
    w: 22,
    h: 30,
    z: index,
  };
}
