"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProductById, getDesignerPhoto, hasSidePhoto, type Product } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "@/components/design/ImageUploader";
import DesignCanvas from "@/components/design/DesignCanvas";
import type { DesignLayer, LayerNaturalSize } from "@/components/design/DesignCanvas";
import DesignControls from "@/components/design/DesignControls";
import { aspectFitSize, pxToMm, isV2, type DesignConfigV2, type MmLayer } from "@/lib/design-schema";
import { hydrateFromDesignConfig } from "@/lib/design/hydrate";
import { use } from "react";

type SideState = {
  layers: DesignLayer[];
  activeLayerId: string | null;
};

function emptySide(): SideState {
  return { layers: [], activeLayerId: null };
}

let layerIdCounter = 0;
function nextLayerId() {
  return `layer-${++layerIdCounter}`;
}

// Emit mm-based schema (DesignConfigV2). Needs the print-area DOM size and
// each layer's natural (image-file) pixel dimensions to convert the UI's
// viewport-pixel drag position + aspect-fit scale into physical mm on the
// garment. Skips sides that aren't valid for the currently-selected color
// (Codex #1 + #3 carried forward from the v1 payload builder).
function buildDesignPayload(
  product: Product,
  sides: Record<string, SideState>,
  selectedSize: string,
  selectedColor: string,
  printAreaPx: { w: number; h: number } | null,
  naturalByLayer: Record<string, LayerNaturalSize>
): { designConfig: DesignConfigV2; primaryImage: string } | null {
  if (!printAreaPx || printAreaPx.w === 0 || printAreaPx.h === 0) return null;

  const sidesConfig: Record<string, MmLayer[]> = {};

  for (const [side, state] of Object.entries(sides)) {
    if (state.layers.length === 0) continue;
    if (!hasSidePhoto(product, side, selectedColor)) continue;
    const spec = product.measurements?.printSpecs?.[side];
    if (!spec) continue;

    const mmLayers: MmLayer[] = [];
    for (const layer of state.layers) {
      const natural = naturalByLayer[layer.id];
      if (!natural) continue;

      const base = aspectFitSize(natural.w, natural.h, printAreaPx.w, printAreaPx.h);
      const renderedPxW = base.w * layer.scale;
      const renderedPxH = base.h * layer.scale;

      mmLayers.push({
        image: layer.image,
        xMm: pxToMm(layer.position.x, printAreaPx.w, spec.widthMm),
        yMm: pxToMm(layer.position.y, printAreaPx.h, spec.heightMm),
        widthMm: pxToMm(renderedPxW, printAreaPx.w, spec.widthMm),
        heightMm: pxToMm(renderedPxH, printAreaPx.h, spec.heightMm),
      });
    }
    if (mmLayers.length > 0) sidesConfig[side] = mmLayers;
  }

  const primaryImage =
    sidesConfig.front?.[0]?.image ??
    Object.values(sidesConfig)[0]?.[0]?.image ??
    "";

  const designConfig: DesignConfigV2 = {
    schemaVersion: 2,
    size: selectedSize,
    color: selectedColor,
    sides: sidesConfig,
  };

  return { designConfig, primaryImage };
}

export default function DesignPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const product = getProductById(productId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const designIdParam = searchParams.get("designId");

  // Edit mode: when a designId is in the URL, hydrate the saved row into
  // canvas state. Save then UPDATEs that row instead of inserting a copy.
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState<boolean>(!!designIdParam);
  const hydratedFor = useRef<string | null>(null);

  const [activeSide, setActiveSide] = useState(product?.printAreas[0] ?? "front");
  const [sides, setSides] = useState<Record<string, SideState>>(() => {
    const initial: Record<string, SideState> = {};
    for (const side of product?.printAreas ?? ["front"]) {
      initial[side] = emptySide();
    }
    return initial;
  });
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? "");
  const [saving, setSaving] = useState(false);
  // Synchronous guard against double-clicks on Add-to-cart — setSaving(true)
  // doesn't block re-entry during the same event loop tick. Closes Codex #2.
  const addToCartInFlight = useRef(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [designRenderedSize, setDesignRenderedSize] = useState<{ w: number; h: number } | null>(null);
  // For triggering the file input from "Add design" button
  const [pendingUpload, setPendingUpload] = useState(false);
  // Print-area DOM ref + per-layer natural sizes, captured from DesignCanvas
  // callbacks so we can convert to mm at save time.
  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const [naturalByLayer, setNaturalByLayer] = useState<Record<string, LayerNaturalSize>>({});

  // Tracked via state so hydration effect can wait for the print-area DOM
  // node before sampling clientWidth/clientHeight.
  const [printAreaEl, setPrintAreaEl] = useState<HTMLDivElement | null>(null);
  const handlePrintAreaRef = useCallback((el: HTMLDivElement | null) => {
    printAreaRef.current = el;
    setPrintAreaEl(el);
  }, []);

  const handleLayerNaturalSize = useCallback(
    (layerId: string, size: LayerNaturalSize) => {
      setNaturalByLayer((prev) => ({ ...prev, [layerId]: size }));
    },
    []
  );

  // If user switches to a color that lacks the current side's photo, fall back to front
  useEffect(() => {
    if (!product) return;
    if (!hasSidePhoto(product, activeSide, selectedColor)) {
      setActiveSide(product.printAreas[0] ?? "front");
    }
  }, [product, activeSide, selectedColor]);

  // Edit mode: hydrate saved design into canvas state. Runs once per
  // designId once the print-area DOM node is mounted (so we have its
  // pixel size for the mm→px inversion).
  useEffect(() => {
    if (!designIdParam) return;
    if (!product) return;
    if (!printAreaEl) return;
    if (hydratedFor.current === designIdParam) return;
    hydratedFor.current = designIdParam;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("designs")
          .select("id, product_id, design_config")
          .eq("id", designIdParam)
          .maybeSingle();
        if (cancelled) return;

        if (error || !data) {
          console.error("[design] hydrate: design not found", { designIdParam, error });
          alert("Couldn't load saved design — starting fresh.");
          setHydrating(false);
          return;
        }

        // Stale URL: designId is for a different product. Silently bounce
        // to the correct product page; preserve the designId.
        if (data.product_id !== product.id) {
          router.replace(`/design/${data.product_id}?designId=${designIdParam}`);
          return;
        }

        if (!isV2(data.design_config)) {
          console.error("[design] hydrate: design_config not v2", { designIdParam });
          alert("Couldn't load saved design — starting fresh.");
          setHydrating(false);
          return;
        }

        const paW = printAreaEl.clientWidth;
        const paH = printAreaEl.clientHeight;
        if (paW === 0 || paH === 0) {
          console.error("[design] hydrate: print area not measured");
          setHydrating(false);
          return;
        }

        const hydrated = await hydrateFromDesignConfig({
          config: data.design_config as DesignConfigV2,
          product,
          printAreaPx: { w: paW, h: paH },
          nextLayerId,
        });
        if (cancelled) return;

        const newSides: Record<string, SideState> = {};
        for (const side of product.printAreas) {
          const layers = hydrated.sides[side] ?? [];
          newSides[side] = {
            layers,
            activeLayerId: layers[layers.length - 1]?.id ?? null,
          };
        }
        setSides(newSides);
        setNaturalByLayer(hydrated.naturalByLayer);
        setSelectedSize(hydrated.size);
        setSelectedColor(hydrated.color);
        // Activate the first side that actually has layers.
        const sideWithLayers = product.printAreas.find((s) => (hydrated.sides[s]?.length ?? 0) > 0);
        if (sideWithLayers) setActiveSide(sideWithLayers);
        setEditingDesignId(designIdParam);
        setHydrating(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[design] hydrate failed", err);
        alert("Couldn't load saved design — starting fresh.");
        setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [designIdParam, product, printAreaEl, router]);

  const current = sides[activeSide] ?? emptySide();
  const activeLayer = current.layers.find((l) => l.id === current.activeLayerId) ?? null;

  const updateSide = useCallback(
    (patch: Partial<SideState>) => {
      setSides((prev) => ({
        ...prev,
        [activeSide]: { ...prev[activeSide], ...patch },
      }));
    },
    [activeSide]
  );

  const handleImageUpload = useCallback(
    (dataUrl: string) => {
      const id = nextLayerId();
      setSides((prev) => {
        const side = prev[activeSide] ?? emptySide();
        return {
          ...prev,
          [activeSide]: {
            layers: [...side.layers, { id, image: dataUrl, position: { x: 0, y: 0 }, scale: 1 }],
            activeLayerId: id,
          },
        };
      });
      setPendingUpload(false);
    },
    [activeSide]
  );

  const handleSelectLayer = useCallback(
    (layerId: string) => {
      updateSide({ activeLayerId: layerId });
    },
    [updateSide]
  );

  const handleDeleteLayer = useCallback(
    (layerId: string) => {
      setSides((prev) => {
        const side = prev[activeSide] ?? emptySide();
        const newLayers = side.layers.filter((l) => l.id !== layerId);
        return {
          ...prev,
          [activeSide]: {
            layers: newLayers,
            activeLayerId:
              side.activeLayerId === layerId
                ? newLayers[newLayers.length - 1]?.id ?? null
                : side.activeLayerId,
          },
        };
      });
    },
    [activeSide]
  );

  const handleAddLayer = useCallback(() => {
    setPendingUpload(true);
  }, []);

  const handleLayerPositionChange = useCallback(
    (layerId: string, pos: { x: number; y: number }) => {
      setSides((prev) => {
        const side = prev[activeSide] ?? emptySide();
        return {
          ...prev,
          [activeSide]: {
            ...side,
            layers: side.layers.map((l) =>
              l.id === layerId ? { ...l, position: pos } : l
            ),
          },
        };
      });
    },
    [activeSide]
  );

  const handleScaleChange = useCallback(
    (s: number) => {
      if (!current.activeLayerId) return;
      const layerId = current.activeLayerId;
      setSides((prev) => {
        const side = prev[activeSide] ?? emptySide();
        return {
          ...prev,
          [activeSide]: {
            ...side,
            layers: side.layers.map((l) =>
              l.id === layerId ? { ...l, scale: s } : l
            ),
          },
        };
      });
    },
    [activeSide, current.activeLayerId]
  );

  const handleReset = useCallback(() => {
    if (!current.activeLayerId) return;
    const layerId = current.activeLayerId;
    setSides((prev) => {
      const side = prev[activeSide] ?? emptySide();
      return {
        ...prev,
        [activeSide]: {
          ...side,
          layers: side.layers.map((l) =>
            l.id === layerId ? { ...l, position: { x: 0, y: 0 }, scale: 1 } : l
          ),
        },
      };
    });
  }, [activeSide, current.activeLayerId]);

  const handleAlign = useCallback(
    (alignment: string) => {
      if (!current.activeLayerId || !designRenderedSize) return;
      const pa = printAreaRef.current;
      if (!pa) return;

      const paW = pa.clientWidth;
      const paH = pa.clientHeight;
      const dW = designRenderedSize.w;
      const dH = designRenderedSize.h;

      const maxX = Math.max(0, (paW - dW) / 2);
      const maxY = Math.max(0, (paH - dH) / 2);

      const layerId = current.activeLayerId;
      const layer = current.layers.find((l) => l.id === layerId);
      if (!layer) return;

      const pos = { ...layer.position };

      switch (alignment) {
        case "left":
          pos.x = -maxX;
          break;
        case "center-h":
          pos.x = 0;
          break;
        case "right":
          pos.x = maxX;
          break;
        case "top":
          pos.y = -maxY;
          break;
        case "center-v":
          pos.y = 0;
          break;
        case "bottom":
          pos.y = maxY;
          break;
      }

      handleLayerPositionChange(layerId, pos);
    },
    [current.activeLayerId, current.layers, designRenderedSize, handleLayerPositionChange]
  );

  const hasAnyDesign = Object.values(sides).some((s) => s.layers.length > 0);

  const getPrintAreaPx = useCallback((): { w: number; h: number } | null => {
    const pa = printAreaRef.current;
    if (!pa) return null;
    return { w: pa.clientWidth, h: pa.clientHeight };
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasAnyDesign || !product) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const payload = buildDesignPayload(
      product,
      sides,
      selectedSize,
      selectedColor,
      getPrintAreaPx(),
      naturalByLayer
    );

    if (!payload || !payload.primaryImage) {
      setSaving(false);
      alert("Your design has no valid artwork for the selected color.");
      return;
    }

    if (editingDesignId) {
      const { error } = await supabase
        .from("designs")
        .update({
          name: `${product.name} Design`,
          image_url: payload.primaryImage,
          design_config: payload.designConfig,
        })
        .eq("id", editingDesignId);
      setSaving(false);
      if (error) {
        alert("Failed to update design.");
        return;
      }
      alert("Design updated!");
      return;
    }

    const { error } = await supabase.from("designs").insert({
      user_id: user.id,
      product_id: product.id,
      name: `${product.name} Design`,
      image_url: payload.primaryImage,
      design_config: payload.designConfig,
    });
    setSaving(false);
    if (error) {
      alert("Failed to save design.");
      return;
    }
    alert("Design saved!");
  }, [hasAnyDesign, product, sides, selectedSize, selectedColor, router, getPrintAreaPx, naturalByLayer, editingDesignId]);

  const handleAddToCart = useCallback(async () => {
    if (addToCartInFlight.current) return;
    if (!hasAnyDesign || !product) return;
    addToCartInFlight.current = true;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const payload = buildDesignPayload(
        product,
        sides,
        selectedSize,
        selectedColor,
        getPrintAreaPx(),
        naturalByLayer
      );

      if (!payload || !payload.primaryImage) {
        alert("Your design has no valid artwork for the selected color.");
        return;
      }

      let designId: string;
      if (editingDesignId) {
        const { error: updateErr } = await supabase
          .from("designs")
          .update({
            name: `${product.name} Design`,
            image_url: payload.primaryImage,
            design_config: payload.designConfig,
          })
          .eq("id", editingDesignId);
        if (updateErr) {
          alert("Failed to update design.");
          return;
        }
        designId = editingDesignId;
      } else {
        const { data: design, error: designErr } = await supabase
          .from("designs")
          .insert({
            user_id: user.id,
            product_id: product.id,
            name: `${product.name} Design`,
            image_url: payload.primaryImage,
            design_config: payload.designConfig,
          })
          .select("id")
          .single();

        if (designErr || !design) {
          alert("Failed to save design.");
          return;
        }
        designId = design.id;
      }

      const { error: cartErr } = await supabase.from("cart_items").insert({
        user_id: user.id,
        design_id: designId,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
      });

      if (cartErr) {
        // For new designs only, roll back the orphan so retries don't
        // accumulate garbage. In edit mode the design legitimately exists
        // and updates have already been applied — leave it alone.
        if (!editingDesignId) {
          await supabase.from("designs").delete().eq("id", designId);
        }
        alert("Failed to add to cart. Please try again.");
        return;
      }

      router.push("/cart");
    } finally {
      setSaving(false);
      addToCartInFlight.current = false;
    }
  }, [hasAnyDesign, product, sides, selectedSize, selectedColor, router, getPrintAreaPx, naturalByLayer, editingDesignId]);

  if (!product) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h1>Product not found</h1>
      </div>
    );
  }

  const currentPrintSpec = product.measurements?.printSpecs?.[activeSide];

  let designDimensions: { widthCm: number; heightCm: number } | null = null;
  if (currentPrintSpec && activeLayer && designRenderedSize && printAreaRef.current) {
    const pa = printAreaRef.current;
    const paW = pa.clientWidth;
    const paH = pa.clientHeight;
    const pxPerMmW = paW / currentPrintSpec.widthMm;
    const pxPerMmH = paH / currentPrintSpec.heightMm;
    designDimensions = {
      widthCm: designRenderedSize.w / pxPerMmW / 10,
      heightCm: designRenderedSize.h / pxPerMmH / 10,
    };
  }

  // Show uploader when no layers exist or when user clicked "Add design"
  const showUploader = !previewMode && (current.layers.length === 0 || pendingUpload);

  return (
    <section className="design-page">
      <div className="container">
        <h1 className="design-page__title">Design: {product.name}</h1>
        {hydrating && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontSize: 16,
              fontWeight: 600,
              color: "var(--dark)",
            }}
          >
            Loading saved design…
          </div>
        )}
        <div className="design-page__layout">
          <div className="design-page__left">
            <DesignCanvas
              productPhoto={getDesignerPhoto(product, activeSide, selectedColor)}
              layers={current.layers}
              activeLayerId={current.activeLayerId}
              printSpec={currentPrintSpec}
              onLayerPositionChange={handleLayerPositionChange}
              onSelectLayer={handleSelectLayer}
              onDesignRenderedSize={setDesignRenderedSize}
              previewMode={previewMode}
              onPrintAreaRef={handlePrintAreaRef}
              onLayerNaturalSize={handleLayerNaturalSize}
            />
            {showUploader && (
              <ImageUploader
                onImageUpload={handleImageUpload}
              />
            )}
            {pendingUpload && (
              <button
                className="btn btn--outline"
                onClick={() => setPendingUpload(false)}
                style={{ marginTop: 8, width: "100%" }}
              >
                Cancel
              </button>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className={`btn ${previewMode ? "btn--primary" : "btn--outline"}`}
                onClick={() => setPreviewMode(!previewMode)}
                style={{ flex: 1 }}
              >
                {previewMode ? "Exit Preview" : "Preview"}
              </button>
            </div>
          </div>
          <div className="design-page__right">
            <DesignControls
              product={product}
              activeSide={activeSide}
              onSideChange={setActiveSide}
              layers={current.layers}
              activeLayerId={current.activeLayerId}
              onSelectLayer={handleSelectLayer}
              onDeleteLayer={handleDeleteLayer}
              onAddLayer={handleAddLayer}
              scale={activeLayer?.scale ?? 1}
              onScaleChange={handleScaleChange}
              onAlign={handleAlign}
              onReset={handleReset}
              designDimensions={designDimensions}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              onSave={handleSave}
              onAddToCart={handleAddToCart}
              hasDesign={hasAnyDesign}
              saving={saving}
              isEditing={!!editingDesignId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
