import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllCompanies } from "../../companyApi";
import { getAllProducts } from "../../productApi";
import {
  emptyItem,
  emptyGst,
  emptyTaxBreakup,
  SELLER_CLEAR,
  CONSIGNEE_CLEAR,
  BUYER_CLEAR,
  mapCompanyToSellerFields,
  mapCompanyToConsigneeFields,
  mapCompanyToBuyerFields,
  computeLineTotals,
} from "./voucherMapperUtils";
import {
  sanitizeNonNegativeInput,
  finalizeNonNegativeInput,
  calcItemAmount,
  calcGstAmountFromRate,
} from "./numberInputUtils";

const TAX_BREAKUP_NUMERIC_FIELDS = new Set([
  "taxableValue",
  "cgstRate",
  "cgstAmount",
  "sgstRate",
  "sgstAmount",
  "igstRate",
  "igstAmount",
  "totalTaxAmount",
]);

/**
 * Shared form state + handlers for voucher documents.
 */
export function useVoucherForm({
  initialData,
  onDataChange,
  itemsKey = "Items",
  includeConsignee = true,
  includeTaxBreakup = false,
}) {
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialData || {});
  const [items, setItems] = useState(
    initialData?.[itemsKey]?.length ? initialData[itemsKey] : [emptyItem()]
  );
  const [gstDetails, setGstDetails] = useState(
    initialData?.GstDetails?.length ? initialData.GstDetails : [emptyGst()]
  );
  const [taxBreakup, setTaxBreakup] = useState(
    initialData?.TaxBreakup?.length ? initialData.TaxBreakup : [emptyTaxBreakup()]
  );

  useEffect(() => {
    Promise.all([getAllCompanies(), getAllProducts()])
      .then(([companyList, productList]) => {
        setCompanies(Array.isArray(companyList) ? companyList : []);
        setProducts(Array.isArray(productList) ? productList : []);
      })
      .catch(() => toast.error("Failed to load master data"));
  }, []);

  useEffect(() => {
    if (!products.length) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.productId || !item.itemname) return item;
        const match = products.find((p) => p.name === item.itemname);
        if (!match) return item;
        changed = true;
        return {
          ...item,
          productId: String(match.id),
          hsnSac: item.hsnSac || match.hsn_sac || "",
          unit: item.unit || match.units || "nos",
        };
      });
      return changed ? next : prev;
    });
  }, [products]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanySelect = (role, companyId) => {
    if (!companyId) {
      const clear =
        role === "seller" ? SELLER_CLEAR : role === "consignee" ? CONSIGNEE_CLEAR : BUYER_CLEAR;
      setFormData((prev) => ({ ...prev, ...clear }));
      return;
    }
    const company = companies.find((c) => String(c.id) === String(companyId));
    if (!company) return;
    const mapper =
      role === "seller"
        ? mapCompanyToSellerFields
        : role === "consignee"
          ? mapCompanyToConsigneeFields
          : mapCompanyToBuyerFields;
    setFormData((prev) => ({ ...prev, ...mapper(company) }));
  };

  const handleProductSelect = (index, productId) => {
    if (!productId) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], productId: "", itemname: "", hsnSac: "", unit: "nos", amount: "" };
        return updated;
      });
      return;
    }
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return;
    setItems((prev) => {
      const updated = [...prev];
      const nextItem = {
        ...updated[index],
        productId: String(productId),
        itemname: product.name,
        hsnSac: product.hsn_sac || "",
        unit: product.units || "nos",
      };
      nextItem.amount = calcItemAmount(nextItem.quantity, nextItem.rate);
      updated[index] = nextItem;
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const nextValue =
        field === "quantity" || field === "rate" ? sanitizeNonNegativeInput(value) : value;
      updated[index] = { ...updated[index], [field]: nextValue };
      if (field === "quantity" || field === "rate") {
        updated[index].amount = calcItemAmount(updated[index].quantity, updated[index].rate);
      }
      return updated;
    });
  };

  const handleItemBlur = (index, field) => {
    if (field !== "quantity" && field !== "rate") return;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: finalizeNonNegativeInput(updated[index][field]),
        amount: calcItemAmount(
          finalizeNonNegativeInput(updated[index].quantity),
          finalizeNonNegativeInput(updated[index].rate)
        ),
      };
      return updated;
    });
  };

  const handleGstChange = (index, field, value, itemsTotal = 0) => {
    setGstDetails((prev) => {
      const updated = [...prev];
      const nextValue = sanitizeNonNegativeInput(value);
      updated[index] = { ...updated[index], [field]: nextValue };
      if (field === "rate") {
        updated[index].amount = calcGstAmountFromRate(itemsTotal, nextValue);
      }
      return updated;
    });
  };

  const handleGstBlur = (index, field, itemsTotal = 0) => {
    setGstDetails((prev) => {
      const updated = [...prev];
      const finalized = finalizeNonNegativeInput(updated[index][field], field === "amount");
      updated[index] = { ...updated[index], [field]: finalized };
      if (field === "rate") {
        updated[index].amount = calcGstAmountFromRate(itemsTotal, finalized);
      }
      return updated;
    });
  };

  const handleTaxBreakupChange = (index, field, value) => {
    setTaxBreakup((prev) => {
      const updated = [...prev];
      const nextValue = TAX_BREAKUP_NUMERIC_FIELDS.has(field)
        ? sanitizeNonNegativeInput(value)
        : value;
      updated[index] = { ...updated[index], [field]: nextValue };
      return updated;
    });
  };

  const handleTaxBreakupBlur = (index, field) => {
    if (!TAX_BREAKUP_NUMERIC_FIELDS.has(field)) return;
    setTaxBreakup((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: finalizeNonNegativeInput(updated[index][field]),
      };
      return updated;
    });
  };

  const { itemsTotal, totalQty, gstTotal, grandTotal } = computeLineTotals(items, gstDetails);

  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      TotalAmount: grandTotal,
      [itemsKey]: items,
      GstDetails: gstDetails,
      ...(includeTaxBreakup ? { TaxBreakup: taxBreakup } : {}),
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, items, gstDetails, taxBreakup, grandTotal]);

  return {
    companies,
    products,
    formData,
    setFormData,
    items,
    setItems,
    gstDetails,
    setGstDetails,
    taxBreakup,
    setTaxBreakup,
    itemsTotal,
    totalQty,
    gstTotal,
    grandTotal,
    handleFieldChange,
    handleCompanySelect,
    handleProductSelect,
    handleItemChange,
    handleItemBlur,
    handleGstChange,
    handleGstBlur,
    handleTaxBreakupChange,
    handleTaxBreakupBlur,
    addItem: () => setItems((prev) => [...prev, emptyItem()]),
    removeItem: (index) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)),
    addGst: () => setGstDetails((prev) => [...prev, emptyGst()]),
    removeGst: (index) =>
      setGstDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)),
    addTaxBreakup: () => setTaxBreakup((prev) => [...prev, emptyTaxBreakup()]),
    removeTaxBreakup: (index) =>
      setTaxBreakup((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)),
    includeConsignee,
    includeTaxBreakup,
  };
}
