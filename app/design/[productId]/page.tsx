"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProductById } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "@/components/design/ImageUploader";
import DesignCanvas from "@/components/design/DesignCanvas";
import DesignControls from "@/components/design/DesignControls";
import { use } from "react";

export default function DesignPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const product = getProductById(productId);
  const router = useRouter();

  const [designImage, setDesignImage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? "");
  const [saving, setSaving] = useState(false);

  const handleReset = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, []);

  const handleSave = useCallback(async () => {
    if (!designImage || !product) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("designs").insert({
      user_id: user.id,
      product_id: product.id,
      name: `${product.name} Design`,
      image_url: designImage,
      design_config: { position, scale, size: selectedSize, color: selectedColor },
    });
    setSaving(false);
    alert("Design saved!");
  }, [designImage, product, position, scale, selectedSize, selectedColor, router]);

  const handleAddToCart = useCallback(async () => {
    if (!designImage || !product) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Save design first, then add to cart
    const { data: design } = await supabase.from("designs").insert({
      user_id: user.id,
      product_id: product.id,
      name: `${product.name} Design`,
      image_url: designImage,
      design_config: { position, scale, size: selectedSize, color: selectedColor },
    }).select("id").single();

    if (design) {
      await supabase.from("cart_items").insert({
        user_id: user.id,
        design_id: design.id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
      });
      router.push("/cart");
    }
    setSaving(false);
  }, [designImage, product, position, scale, selectedSize, selectedColor, router]);

  if (!product) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h1>Product not found</h1>
      </div>
    );
  }

  return (
    <section className="design-page">
      <div className="container">
        <h1 className="design-page__title">Design: {product.name}</h1>
        <div className="design-page__layout">
          <div className="design-page__left">
            <DesignCanvas
              productEmoji={product.emoji}
              designImage={designImage}
              position={position}
              scale={scale}
              onPositionChange={setPosition}
            />
            {!designImage && <ImageUploader onImageUpload={setDesignImage} />}
            {designImage && (
              <button className="btn btn--outline" onClick={() => setDesignImage(null)} style={{ marginTop: 16, width: "100%" }}>
                Replace image
              </button>
            )}
          </div>
          <div className="design-page__right">
            <DesignControls
              product={product}
              scale={scale}
              onScaleChange={setScale}
              onReset={handleReset}
              onSave={handleSave}
              onAddToCart={handleAddToCart}
              hasDesign={!!designImage}
              saving={saving}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
