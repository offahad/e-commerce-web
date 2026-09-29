import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Users,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Printer,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Edit3,
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  Activity,
  Check,
  ChevronRight,
  ChevronLeft,
  Key,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavSection =
  | 'overview'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'banners'
  | 'customers'
  | 'staff';

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // Active Role Simulator for testing allowed vs denied access
  const [activeRole, setActiveRole] = useState<'SUPER_ADMIN' | 'MODERATOR'>(() => {
    return user?.role === 'MODERATOR' ? 'MODERATOR' : 'SUPER_ADMIN';
  });

  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  // Navigation tabs (Exact 7 sections)
  const [activeSection, setActiveSection] = useState<NavSection>('overview');

  // Global Feedback States
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-dismiss banners
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Keyboard accessibility: Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // --------------------------------------------------------------------------
  // SECTION 1: OVERVIEW & GENERAL DATA LOADERS
  // --------------------------------------------------------------------------
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any>({
    outOfStockCount: 0,
    lowStockCount: 0,
    outOfStockProducts: [],
    lowStockProducts: [],
    lowStockVariants: [],
  });
  const [banners, setBanners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);

  const loadAllData = async () => {
    setLoadingOverview(true);
    try {
      // 1. Orders
      const ordersRes = await api.getAdminOrders();
      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      }

      // 2. Products & Categories
      const prodRes = await api.getProducts({ limit: 100 });
      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
      const catRes = await api.getCategories();
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }

      // 3. Stock Alerts
      const alertsRes = await api.getAdminStockAlerts();
      if (alertsRes.success && alertsRes.data) {
        setStockAlerts(alertsRes.data);
      }

      // 4. Hero Banners
      const bannersRes = await api.getAdminHeroBanners();
      if (bannersRes.success && Array.isArray(bannersRes.data)) {
        setBanners(bannersRes.data);
      }

      // 5. Inventory Transactions
      const trxRes = await api.getInventoryTransactions({ limit: 40 });
      if (trxRes.success && Array.isArray(trxRes.data)) {
        setInventoryTransactions(trxRes.data);
      }

      // 6. Super Admin specific data (Customer approvals, Staff, Audit)
      if (isSuperAdmin) {
        const custRes = await api.getAdminCustomers();
        if (custRes.success && Array.isArray(custRes.data)) {
          setCustomers(custRes.data);
        }

        const staffRes = await api.getStaff();
        if (staffRes.success && Array.isArray(staffRes.data)) {
          setStaffList(staffRes.data);
        }

        const logsRes = await api.getAuditLogs({ limit: 40 });
        if (logsRes.success && Array.isArray(logsRes.data)) {
          setAuditLogs(logsRes.data);
        }
      }
    } catch (err: any) {
      console.error('Data load error:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, activeRole]);

  // Derived Overview Metrics
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.grand_total || o.grandTotal || 0), 0);
  }, [orders]);

  const pendingApprovalsCount = useMemo(() => {
    return customers.filter((c) => c.status === 'PENDING_APPROVAL').length;
  }, [customers]);

  // --------------------------------------------------------------------------
  // SECTION 2: ORDERS MANAGEMENT
  // --------------------------------------------------------------------------
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderModalMode, setOrderModalMode] = useState<'details' | 'status' | 'invoice' | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<string>('CONFIRMED');
  const [orderStatusComment, setOrderStatusComment] = useState<string>('');
  const [updatingOrder, setUpdatingOrder] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = o.status || 'PENDING';
      const matchFilter = orderFilter === 'ALL' || status === orderFilter;
      const term = orderSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        (o.order_number || o.orderNumber || '').toLowerCase().includes(term) ||
        (o.tracking_number || o.trackingNumber || '').toLowerCase().includes(term) ||
        (o.customer_name || o.phone || '').toLowerCase().includes(term);
      return matchFilter && matchSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    setUpdatingOrder(true);
    setActionError(null);
    try {
      const res = await api.updateOrderStatus(selectedOrder.id, newOrderStatus, orderStatusComment.trim() || undefined);
      if (res.success) {
        setActionSuccess(`Order #${selectedOrder.order_number || selectedOrder.orderNumber} transitioned to ${newOrderStatus}`);
        setOrderModalMode(null);
        setSelectedOrder(null);
        setOrderStatusComment('');
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to update order status');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error updating order');
    } finally {
      setUpdatingOrder(false);
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 3: PRODUCT MANAGEMENT
  // --------------------------------------------------------------------------
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // New product form fields
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdBasePrice, setNewProdBasePrice] = useState<number | ''>('');
  const [newProdSalePrice, setNewProdSalePrice] = useState<number | ''>('');
  const [newProdStock, setNewProdStock] = useState<number | ''>('');
  const [newProdUnit, setNewProdUnit] = useState('piece');
  const [newProdThumbnail, setNewProdThumbnail] = useState('');
  const [newProdThreshold, setNewProdThreshold] = useState<number>(5);

  // Edit product fields
  const [editPriceBase, setEditPriceBase] = useState<number>(0);
  const [editPriceSale, setEditPriceSale] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editStockReason, setEditStockReason] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        productCategoryFilter === 'ALL' ||
        p.primary_category_id === productCategoryFilter ||
        p.category_slug === productCategoryFilter;
      const term = productSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || !newProdBasePrice || !newProdSalePrice) {
      setActionError('Product Name, SKU, Base Price and Sale Price are required.');
      return;
    }
    setSavingProduct(true);
    setActionError(null);
    try {
      const payload = {
        name: newProdName.trim(),
        sku: newProdSku.trim().toUpperCase(),
        primaryCategoryId: newProdCategory || undefined,
        basePrice: Number(newProdBasePrice),
        salePrice: Number(newProdSalePrice),
        stockQuantity: Number(newProdStock || 0),
        lowStockThreshold: Number(newProdThreshold || 5),
        unit: newProdUnit.trim(),
        thumbnailUrl: newProdThumbnail.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        images: newProdThumbnail ? [newProdThumbnail.trim()] : [],
        status: 'ACTIVE',
      };
      const res = await api.createProduct(payload);
      if (res.success) {
        setActionSuccess(`Product '${newProdName}' created and registered in inventory ledger.`);
        setShowAddProductModal(false);
        setNewProdName('');
        setNewProdSku('');
        setNewProdBasePrice('');
        setNewProdSalePrice('');
        setNewProdStock('');
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to create product');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    setActionError(null);
    try {
      const payload: any = {
        basePrice: Number(editPriceBase),
        salePrice: Number(editPriceSale),
      };
      if (editStock !== Number(editingProduct.stock_quantity)) {
        if (!editStockReason.trim() || editStockReason.trim().length < 3) {
          setActionError('A valid reason (min 3 chars) is mandatory to adjust inventory stock.');
          setSavingProduct(false);
          return;
        }
        payload.stockQuantity = Number(editStock);
      }
      const res = await api.updateProduct(editingProduct.id, payload);
      if (res.success) {
        setActionSuccess(`Product '${editingProduct.name}' updated with ledger sync.`);
        setEditingProduct(null);
        setEditStockReason('');
        loadAllData();
      } else {
        setActionError(res.message || 'Update failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating product');
    } finally {
      setSavingProduct(false);
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 4: INVENTORY MANAGEMENT & ALERT ACKNOWLEDGEMENT
  // --------------------------------------------------------------------------
  const [selectedAlertForAck, setSelectedAlertForAck] = useState<any | null>(null);
  const [ackNote, setAckNote] = useState<string>('Restock PO submitted to primary distributor.');
  const [ackingAlert, setAckingAlert] = useState(false);

  // Stock Adjustment Form
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [adjustQuantity, setAdjustQuantity] = useState<number | ''>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustingStock, setAdjustingStock] = useState(false);

  const handleAcknowledgeAlert = async () => {
    if (!selectedAlertForAck) return;
    setAckingAlert(true);
    setActionError(null);
    try {
      const res = await api.acknowledgeStockAlert({
        productId: selectedAlertForAck.id || selectedAlertForAck.product_id,
        variantId: selectedAlertForAck.variant_id || null,
        alertType: selectedAlertForAck.alertType || 'LOW_STOCK',
        note: ackNote.trim() || 'Reviewed by inventory manager',
      });
      if (res.success) {
        setActionSuccess(`Alert acknowledged for '${selectedAlertForAck.name || selectedAlertForAck.product_name}'`);
        setSelectedAlertForAck(null);
        setAckNote('');
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to acknowledge alert');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error');
    } finally {
      setAckingAlert(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      setActionError('Please select a product to adjust.');
      return;
    }
    if (!adjustQuantity || Number(adjustQuantity) <= 0) {
      setActionError('Quantity must be a positive integer.');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      setActionError('Reason is mandatory for immutable audit ledger logging (min 3 characters).');
      return;
    }

    setAdjustingStock(true);
    setActionError(null);
    try {
      const res = await api.adjustInventory({
        productId: adjustProductId,
        transactionType: adjustType,
        quantity: Number(adjustQuantity),
        reason: adjustReason.trim(),
      });
      if (res.success) {
        setActionSuccess(`Stock movement recorded: ${adjustType} (${adjustQuantity} units)`);
        setShowAdjustModal(false);
        setAdjustReason('');
        setAdjustQuantity(10);
        loadAllData();
      } else {
        setActionError(res.message || 'Stock adjustment rejected by ledger');
      }
    } catch (err: any) {
      setActionError(err.message || 'Stock adjustment failed');
    } finally {
      setAdjustingStock(false);
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 5: HERO BANNERS CMS (PERSISTENT KNEX / REST API WORKFLOW)
  // --------------------------------------------------------------------------
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [deleteBannerTarget, setDeleteBannerTarget] = useState<any | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);

  // Banner form inputs
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerTag, setBannerTag] = useState('Flash Deals');
  const [bannerButtonText, setBannerButtonText] = useState('Shop now');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerImageAlt, setBannerImageAlt] = useState('Promotional banner');
  const [bannerCategory, setBannerCategory] = useState('vegetables');
  const [bannerOrder, setBannerOrder] = useState<number>(1);
  const [bannerStatus, setBannerStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [bannerStartDate, setBannerStartDate] = useState('');
  const [bannerEndDate, setBannerEndDate] = useState('');

  const openCreateBannerModal = () => {
    setEditingBanner(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerTag('Dhaka Express 15-Min');
    setBannerButtonText('Shop now');
    setBannerImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80');
    setBannerImageAlt('Fresh produce groceries promotional banner');
    setBannerCategory('vegetables');
    setBannerOrder(banners.length + 1);
    setBannerStatus('PUBLISHED');
    setBannerStartDate('');
    setBannerEndDate('');
    setShowBannerModal(true);
  };

  const openEditBannerModal = (b: any) => {
    setEditingBanner(b);
    setBannerTitle(b.title || b.headline || '');
    setBannerSubtitle(b.subtitle || b.subtext || '');
    setBannerTag(b.tag || b.badgeText || '');
    setBannerButtonText(b.button_text || b.buttonText || 'Shop now');
    setBannerImageUrl(b.image_url || b.imageUrl || '');
    setBannerImageAlt(b.image_alt || b.imageAlt || 'Promotional banner');
    setBannerCategory(b.destination_category || b.targetCategory || 'vegetables');
    setBannerOrder(Number(b.display_order || b.displayOrder || 1));
    setBannerStatus((b.status as any) || 'PUBLISHED');
    setBannerStartDate(b.start_date ? b.start_date.split('T')[0] : '');
    setBannerEndDate(b.end_date ? b.end_date.split('T')[0] : '');
    setShowBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImageUrl.trim()) {
      setActionError('Banner Title and Image URL are required.');
      return;
    }

    setSavingBanner(true);
    setActionError(null);
    try {
      const payload: any = {
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim() || null,
        tag: bannerTag.trim() || null,
        buttonText: bannerButtonText.trim() || 'Shop now',
        imageUrl: bannerImageUrl.trim(),
        imageAlt: bannerImageAlt.trim() || 'Promotional banner',
        destinationCategory: bannerCategory || null,
        destinationLink: `/category/${bannerCategory || 'all'}`,
        displayOrder: Number(bannerOrder || 1),
        status: bannerStatus,
        isActive: bannerStatus === 'PUBLISHED',
        startDate: bannerStartDate ? new Date(bannerStartDate).toISOString() : null,
        endDate: bannerEndDate ? new Date(bannerEndDate).toISOString() : null,
      };

      let res;
      if (editingBanner) {
        res = await api.updateHeroBanner(editingBanner.id, payload);
      } else {
        res = await api.createHeroBanner(payload);
      }

      if (res.success) {
        setActionSuccess(
          editingBanner
            ? `Banner '${bannerTitle}' updated and synced to homepage.`
            : `New hero banner published successfully!`
        );
        setShowBannerModal(false);
        setEditingBanner(null);
        window.dispatchEvent(new Event('lb_banners_updated'));
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to save banner');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error processing banner');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteBannerTarget) return;
    setActionError(null);
    try {
      const res = await api.deleteHeroBanner(deleteBannerTarget.id);
      if (res.success) {
        setActionSuccess(`Banner deleted from database.`);
        setDeleteBannerTarget(null);
        window.dispatchEvent(new Event('lb_banners_updated'));
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to delete banner');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error deleting banner');
    }
  };

  const handleToggleBannerStatus = async (bannerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await api.updateHeroBannerStatus(bannerId, nextStatus, nextStatus === 'PUBLISHED');
      if (res.success) {
        setActionSuccess(`Banner status toggled to ${nextStatus}`);
        window.dispatchEvent(new Event('lb_banners_updated'));
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error');
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 6: CUSTOMER APPROVALS QUEUE (SUPER ADMIN EXCLUSIVE)
  // --------------------------------------------------------------------------
  const [customerFilter, setCustomerFilter] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('PENDING_APPROVAL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer360, setCustomer360] = useState<any | null>(null);
  const [approvalModalTarget, setApprovalModalTarget] = useState<any | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalReason, setApprovalReason] = useState<string>('Phone verification and delivery address confirmed.');
  const [processingApproval, setProcessingApproval] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchStatus = c.status === customerFilter;
      const term = customerSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        (c.full_name || '').toLowerCase().includes(term) ||
        (c.phone || '').includes(term);
      return matchStatus && matchSearch;
    });
  }, [customers, customerFilter, customerSearch]);

  const openCustomer360 = async (cust: any) => {
    try {
      const res = await api.getCustomer360(cust.id);
      if (res.success && res.data) {
        setCustomer360(res.data);
      } else {
        setCustomer360({ customer: cust, addresses: [], orders: [], statusHistory: [] });
      }
    } catch {
      setCustomer360({ customer: cust, addresses: [], orders: [], statusHistory: [] });
    }
  };

  const handleProcessApproval = async () => {
    if (!approvalModalTarget) return;
    if (approvalDecision === 'REJECTED' && (!approvalReason.trim() || approvalReason.trim().length < 3)) {
      setActionError('A valid reason is required when rejecting a customer registration.');
      return;
    }

    setProcessingApproval(true);
    setActionError(null);
    try {
      const res = await api.updateCustomerStatus(
        approvalModalTarget.id,
        approvalDecision,
        approvalReason.trim()
      );
      if (res.success) {
        setActionSuccess(
          `Customer account '${approvalModalTarget.full_name}' has been ${approvalDecision}.`
        );
        setApprovalModalTarget(null);
        setApprovalReason('Phone verification and delivery address confirmed.');
        loadAllData();
      } else {
        setActionError(res.message || 'Status update failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Customer approval failed');
    } finally {
      setProcessingApproval(false);
    }
  };

  // --------------------------------------------------------------------------
  // SECTION 7: STAFF AND AUDIT (SUPER ADMIN ONLY)
  // --------------------------------------------------------------------------
  const [staffSubTab, setStaffSubTab] = useState<'staff' | 'mfa' | 'audit'>('staff');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitingStaff, setInvitingStaff] = useState(false);

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MODERATOR' | 'ADMIN' | 'MANAGER' | 'STAFF'>('MODERATOR');
  const [invitePassword, setInvitePassword] = useState('Staff@123456');
  const [inviteNotes, setInviteNotes] = useState('Authorized staff member for Liton Brothers');

  // Staff role edit & status edit
  const [staffRoleModalTarget, setStaffRoleModalTarget] = useState<any | null>(null);
  const [targetNewRole, setTargetNewRole] = useState<string>('MODERATOR');
  const [targetRoleReason, setTargetRoleReason] = useState<string>('Operational department restructuring');
  const [staffStatusModalTarget, setStaffStatusModalTarget] = useState<any | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<string>('SUSPENDED');
  const [targetStatusReason, setTargetStatusReason] = useState<string>('Administrative review');

  // MFA Panel state
  const [mfaSecretData, setMfaSecretData] = useState<any | null>(null);
  const [mfaCodeInput, setMfaCodeInput] = useState<string>('');
  const [settingUpMfa, setSettingUpMfa] = useState(false);

  // Audit log filter
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('ALL');

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchEntity = auditEntityFilter === 'ALL' || log.entity_name === auditEntityFilter;
      const term = auditActionFilter.toLowerCase().trim();
      const matchAction = !term || (log.action || '').toLowerCase().includes(term);
      return matchEntity && matchAction;
    });
  }, [auditLogs, auditActionFilter, auditEntityFilter]);

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !invitePhone.trim() || !invitePassword) {
      setActionError('Full Name, Mobile Phone and Password are required.');
      return;
    }

    setInvitingStaff(true);
    setActionError(null);
    try {
      const res = await api.createStaff({
        fullName: inviteName.trim(),
        phone: invitePhone.trim(),
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
        password: invitePassword,
        notes: inviteNotes.trim(),
      });
      if (res.success) {
        setActionSuccess(`Staff member '${inviteName}' created with role ${inviteRole}.`);
        setShowInviteModal(false);
        setInviteName('');
        setInvitePhone('');
        setInviteEmail('');
        loadAllData();
      } else {
        setActionError(res.message || 'Staff invitation failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error inviting staff');
    } finally {
      setInvitingStaff(false);
    }
  };

  const handleUpdateStaffRole = async () => {
    if (!staffRoleModalTarget) return;
    try {
      const res = await api.updateStaffRole(staffRoleModalTarget.id, targetNewRole, targetRoleReason.trim());
      if (res.success) {
        setActionSuccess(`Updated ${staffRoleModalTarget.full_name}'s role to ${targetNewRole}`);
        setStaffRoleModalTarget(null);
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to update role');
      }
    } catch (err: any) {
      setActionError(err.message || 'Role change failed');
    }
  };

  const handleUpdateStaffStatus = async () => {
    if (!staffStatusModalTarget) return;
    try {
      const res = await api.updateStaffStatus(staffStatusModalTarget.id, targetNewStatus, targetStatusReason.trim());
      if (res.success) {
        setActionSuccess(`Account status updated to ${targetNewStatus}`);
        setStaffStatusModalTarget(null);
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      setActionError(err.message || 'Status update failed');
    }
  };

  const handleInitiateMfa = async () => {
    setSettingUpMfa(true);
    try {
      const res = await api.setupMfa();
      if (res.success && res.data) {
        setMfaSecretData(res.data);
        if (res.data.setupCode) {
          setMfaCodeInput(res.data.setupCode);
        }
      } else {
        setActionError(res.message || 'Could not initiate MFA');
      }
    } catch (err: any) {
      setActionError(err.message || 'MFA initialization failed');
    } finally {
      setSettingUpMfa(false);
    }
  };

  const handleConfirmEnableMfa = async () => {
    if (!mfaCodeInput.trim()) {
      setActionError('Verification code is required.');
      return;
    }
    try {
      const res = await api.enableMfa(mfaCodeInput.trim());
      if (res.success) {
        setActionSuccess('Two-Factor Authentication is now ACTIVE on your account.');
        setMfaSecretData(null);
        setMfaCodeInput('');
      } else {
        setActionError(res.message || 'Invalid code');
      }
    } catch (err: any) {
      setActionError(err.message || 'MFA verification failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-7xl w-full h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* ==================================================================== */}
        {/* TOP SUITE BAR: Current Profile, Role Switcher Simulation & Controls */}
        {/* ==================================================================== */}
        <header className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white shadow-lg">
              LB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Liton Brothers Admin Suite
                </h1>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    activeRole === 'SUPER_ADMIN'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {activeRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Moderator'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> MFA Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in: {user?.fullName || 'Super Administrator'} ({user?.phone || '01700000000'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Role Switcher for Testing Deny-by-default RBAC */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2 hidden sm:inline">Role Simulation:</span>
              <button
                type="button"
                onClick={() => setActiveRole('SUPER_ADMIN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 ${
                  activeRole === 'SUPER_ADMIN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3" /> Super Admin
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('MODERATOR')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 ${
                  activeRole === 'MODERATOR'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" /> Moderator
              </button>
            </div>

            <button
              onClick={loadAllData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOverview ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Feedback Notifications */}
        {actionSuccess && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {actionSuccess}
            </span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-100 hover:text-white">✕</button>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {actionError}
            </span>
            <button onClick={() => setActionError(null)} className="text-rose-100 hover:text-white">✕</button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 7 NAVIGATION SECTIONS (Exact User Specification) */}
        {/* ==================================================================== */}
        <nav className="flex items-center px-4 sm:px-6 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar gap-1 sm:gap-2 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveSection('overview')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'overview'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> 1. Overview
          </button>

          <button
            onClick={() => setActiveSection('orders')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'orders'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" /> 2. Orders
            {orders.filter((o) => o.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                {orders.filter((o) => o.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('products')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'products'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" /> 3. Products
          </button>

          <button
            onClick={() => setActiveSection('inventory')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'inventory'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> 4. Inventory
            {stockAlerts.lowStockCount + stockAlerts.outOfStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                {stockAlerts.lowStockCount + stockAlerts.outOfStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('banners')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'banners'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" /> 5. Hero Banners
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              {banners.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('customers')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'customers'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> 6. Customer Approvals
            {pendingApprovalsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
            {!isSuperAdmin && (
              <span className="text-[10px] font-normal text-slate-400">(Restricted)</span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('staff')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeSection === 'staff'
                ? 'border-emerald-600 text-emerald-700 font-extrabold bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" /> 7. Staff and Audit
            {!isSuperAdmin && (
              <span className="text-[10px] font-normal text-slate-400">(Restricted)</span>
            )}
          </button>
        </nav>

        {/* ==================================================================== */}
        {/* MAIN BODY: Tab View Switcher */}
        {/* ==================================================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* ================================================================ */}
          {/* 1. OVERVIEW SECTION */}
          {/* ================================================================ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    ৳{totalRevenue.toLocaleString()} BDT
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Across {orders.length} placed orders</div>
                </div>

                <div
                  onClick={() => setActiveSection('customers')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 transition"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                    {pendingApprovalsCount} Customer{pendingApprovalsCount === 1 ? '' : 's'}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1 font-semibold">Requires Super Admin approval →</div>
                </div>

                <div
                  onClick={() => setActiveSection('inventory')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-rose-300 transition"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Stock Alerts</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                    {stockAlerts.lowStockCount + stockAlerts.outOfStockCount} Items
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {stockAlerts.outOfStockCount} zero stock, {stockAlerts.lowStockCount} low threshold
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('banners')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Hero Banners</span>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                    {banners.filter((b) => b.status === 'PUBLISHED').length} Published
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Synced to Liton Brothers homepage</div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                  Admin Operational Shortcuts
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveSection('customers')}
                    className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-between transition text-left"
                  >
                    <span>👥 Review Customers</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('inventory');
                      setShowAdjustModal(true);
                    }}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-between transition text-left"
                  >
                    <span>📦 Adjust Stock</span>
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('products');
                      setShowAddProductModal(true);
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-between transition text-left"
                  >
                    <span>✨ Add Product</span>
                    <Plus className="w-3.5 h-3.5 text-blue-700" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('banners');
                      openCreateBannerModal();
                    }}
                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-bold text-xs flex items-center justify-between transition text-left"
                  >
                    <span>🎨 New Hero Banner</span>
                    <Plus className="w-3.5 h-3.5 text-purple-700" />
                  </button>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" /> Recent Placed Orders
                  </h3>
                  <button
                    onClick={() => setActiveSection('orders')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    View All Orders ({orders.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {o.order_number || o.orderNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold block">{o.customer_name || 'Customer'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{o.phone || '01XXXXXXXXX'}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            ৳{Number(o.grand_total || o.grandTotal || 0).toLocaleString()} BDT
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                              {o.payment_method || o.paymentMethod || 'COD'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                (o.status || '') === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (o.status || '') === 'PROCESSING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : (o.status || '') === 'CONFIRMED'
                                  ? 'bg-teal-100 text-teal-800'
                                  : (o.status || '') === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {o.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                setOrderModalMode('details');
                              }}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No orders placed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Audit Activity Snippet (Super Admin) */}
              {isSuperAdmin && auditLogs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" /> Recent Sensitive Action Audit Trail
                    </h3>
                    <button
                      onClick={() => {
                        setActiveSection('staff');
                        setStaffSubTab('audit');
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View All Logs ({auditLogs.length}) →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            {log.action}
                          </span>
                          <span className="text-slate-600 font-medium">
                            by <strong>{log.actor_name || 'System / Admin'}</strong> ({log.actor_role || 'SUPER_ADMIN'})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 2. ORDERS MANAGEMENT SECTION */}
          {/* ================================================================ */}
          {activeSection === 'orders' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                {/* Status tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
                  {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                        orderFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {st} {st !== 'ALL' && `(${orders.filter((o) => (o.status || 'PENDING') === st).length})`}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative min-w-[240px]">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by order #, phone..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Order & Tracking</th>
                        <th className="py-3 px-4">Customer Details</th>
                        <th className="py-3 px-4">Grand Total</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Order Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              {o.order_number || o.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              TRK: {o.tracking_number || o.trackingNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold block text-slate-900">{o.customer_name || 'Customer'}</span>
                            <span className="text-[10px] text-slate-500 block">{o.phone || '01XXXXXXXXX'}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            ৳{Number(o.grand_total || o.grandTotal || 0).toLocaleString()} BDT
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono inline-block">
                                {o.payment_method || o.paymentMethod || 'COD'}
                              </span>
                              <span
                                className={`block text-[10px] font-bold ${
                                  (o.payment_status || o.paymentStatus) === 'PAID'
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {o.payment_status || o.paymentStatus || 'PENDING'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                (o.status || '') === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (o.status || '') === 'PROCESSING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : (o.status || '') === 'CONFIRMED'
                                  ? 'bg-teal-100 text-teal-800'
                                  : (o.status || '') === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {o.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setOrderModalMode('details');
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                                title="View Order Line Items"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setNewOrderStatus(o.status || 'PROCESSING');
                                  setOrderModalMode('status');
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition"
                                title="Transition Order Status"
                              >
                                <Truck className="w-3.5 h-3.5" /> Status
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setOrderModalMode('invoice');
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                                title="Print Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No orders found matching the filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 3. PRODUCTS MANAGEMENT SECTION */}
          {/* ================================================================ */}
          {activeSection === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  {/* Category Filter */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="ALL">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Search */}
                  <div className="relative min-w-[200px]">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product, SKU..."
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Add Product (Ledger Integrated)
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Base / Sale Price</th>
                        <th className="py-3 px-4">Stock Level</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.thumbnail_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">{p.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Unit: {p.unit || 'piece'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">{p.sku}</td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {p.category_name || p.categories?.name || 'Groceries'}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className="text-slate-400 line-through text-[11px] mr-1.5">৳{p.base_price}</span>
                            <span className="font-extrabold text-emerald-700">৳{p.sale_price}</span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                Number(p.stock_quantity) <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : Number(p.stock_quantity) <= (p.low_stock_threshold || 5)
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock_quantity} available
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setEditPriceBase(Number(p.base_price));
                                setEditPriceSale(Number(p.sale_price));
                                setEditStock(Number(p.stock_quantity));
                                setEditStockReason('');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                            >
                              <Edit3 className="w-3 h-3" /> Edit & Ledger
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No products found in inventory.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 4. INVENTORY MANAGEMENT SECTION */}
          {/* ================================================================ */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              {/* Header with quick adjustment button */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Inventory Ledger & Stock Alerts</h3>
                  <p className="text-xs text-slate-500">
                    Immutable stock movement ledger with required audit tracking reasons and alert acknowledgment.
                  </p>
                </div>
                <button
                  onClick={() => setShowAdjustModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Record Stock Movement
                </button>
              </div>

              {/* Low & Out of Stock Alerts Queue */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Active Inventory Alerts
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    Total: {stockAlerts.outOfStockCount + stockAlerts.lowStockCount} items
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Out of stock list */}
                  {stockAlerts.outOfStockProducts?.map((item: any) => (
                    <div
                      key={'out_' + item.id}
                      className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-black uppercase mr-1.5">
                          OUT OF STOCK
                        </span>
                        <strong className="text-xs text-slate-900 block mt-1">{item.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">SKU: {item.sku} • Stock: 0</span>
                        {item.acknowledged && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                            ✓ Acknowledged by {item.acknowledgedByName || 'Staff'} ({item.acknowledgedNote})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAlertForAck(item);
                          setAckNote('Supplier stock reorder PO issued.');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold rounded-lg shrink-0 transition"
                      >
                        {item.acknowledged ? 'Re-Acknowledge' : 'Acknowledge Alert'}
                      </button>
                    </div>
                  ))}

                  {/* Low stock list */}
                  {stockAlerts.lowStockProducts?.map((item: any) => (
                    <div
                      key={'low_' + item.id}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono text-[9px] font-black uppercase mr-1.5">
                          LOW STOCK
                        </span>
                        <strong className="text-xs text-slate-900 block mt-1">{item.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          SKU: {item.sku} • Stock: {item.stock_quantity} (Threshold: {item.low_stock_threshold})
                        </span>
                        {item.acknowledged && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                            ✓ Acknowledged by {item.acknowledgedByName || 'Staff'} ({item.acknowledgedNote})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAlertForAck(item);
                          setAckNote('Scheduled for replenishment in next morning truck.');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-bold rounded-lg shrink-0 transition"
                      >
                        {item.acknowledged ? 'Re-Acknowledge' : 'Acknowledge Alert'}
                      </button>
                    </div>
                  ))}

                  {stockAlerts.outOfStockProducts?.length === 0 && stockAlerts.lowStockProducts?.length === 0 && (
                    <div className="col-span-2 py-6 text-center text-slate-400 text-xs italic">
                      ✓ No low-stock or out-of-stock items detected across the warehouse inventory.
                    </div>
                  )}
                </div>
              </div>

              {/* Immutable Stock Movement Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Immutable Stock Movement Ledger
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">Latest movements</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Product Name & SKU</th>
                        <th className="py-3 px-4">Movement Type</th>
                        <th className="py-3 px-4">Qty Changed</th>
                        <th className="py-3 px-4">Stock Ledger (Prev → New)</th>
                        <th className="py-3 px-4">Mandatory Audit Reason</th>
                        <th className="py-3 px-4">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {inventoryTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                            {new Date(trx.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <span className="font-bold block">{trx.product_name || 'Warehouse Stock Item'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{trx.product_sku}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                                trx.transaction_type === 'STOCK_IN'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : trx.transaction_type === 'STOCK_OUT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {trx.transaction_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {trx.transaction_type === 'STOCK_IN' ? '+' : trx.transaction_type === 'STOCK_OUT' ? '-' : '•'}
                            {trx.quantity_changed}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {trx.previous_stock} → <strong className="text-slate-900">{trx.new_stock}</strong>
                          </td>
                          <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate" title={trx.reason}>
                            "{trx.reason || 'General inventory sync'}"
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {trx.performed_by_name || 'Store Administrator'}
                          </td>
                        </tr>
                      ))}
                      {inventoryTransactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                            No ledger transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 5. HERO BANNERS SECTION (PERSISTENT KNEX / REST API CMS) */}
          {/* ================================================================ */}
          {activeSection === 'banners' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Homepage Hero Carousel Banners</h3>
                  <p className="text-xs text-slate-500">
                    Persistent database CMS for homepage promotion slides with scheduling, display order, image alt text & category target.
                  </p>
                </div>
                <button
                  onClick={openCreateBannerModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Add Carousel Banner
                </button>
              </div>

              {/* Banners Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {banners.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Live Preview Card */}
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      <img
                        src={b.image_url || b.imageUrl}
                        alt={b.image_alt || b.imageAlt || 'Hero banner'}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                            {b.tag || b.badgeText || 'Promotion'}
                          </span>
                          <span className="text-[10px] font-mono bg-black/60 px-2 py-0.5 rounded text-slate-300">
                            Order #{b.display_order || b.displayOrder || 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold line-clamp-1">{b.title || b.headline}</h4>
                          <p className="text-[11px] text-slate-200 line-clamp-2 mt-0.5">{b.subtitle || b.subtext}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-3 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow-sm">
                              {b.button_text || b.buttonText || 'Shop now'}
                            </span>
                            <span className="text-[10px] text-slate-300 font-mono">
                              → /category/{b.destination_category || b.targetCategory || 'groceries'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                              b.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {b.status || 'PUBLISHED'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Alt: "{b.image_alt || b.imageAlt || 'Promotional banner'}"
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBannerStatus(b.id, b.status || 'PUBLISHED')}
                          className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition"
                        >
                          {b.status === 'PUBLISHED' ? 'Set Draft' : 'Publish'}
                        </button>
                        <button
                          onClick={() => openEditBannerModal(b)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit Banner"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeleteBannerTarget(b)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                            title="Delete Banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {banners.length === 0 && (
                  <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    No banners configured. Click "Add Carousel Banner" to create the first promotion.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 6. CUSTOMER APPROVALS QUEUE (SUPER ADMIN EXCLUSIVE) */}
          {/* ================================================================ */}
          {activeSection === 'customers' && (
            <div className="space-y-4">
              {/* RBAC DENIAL NOTICE FOR MODERATOR */}
              {!isSuperAdmin ? (
                <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-rose-900">
                    Access Denied (HTTP 403 Forbidden)
                  </h3>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    The Customer Approvals Queue is strictly restricted to Super Administrators. Store Moderators do not have the <code className="bg-rose-200 px-1 py-0.5 rounded font-mono">USER_APPROVE</code> permission.
                  </p>
                  <button
                    onClick={() => setActiveRole('SUPER_ADMIN')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Switch to Super Admin Simulator →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <button
                        onClick={() => setCustomerFilter('PENDING_APPROVAL')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          customerFilter === 'PENDING_APPROVAL'
                            ? 'bg-amber-600 text-white font-extrabold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Pending Approval ({customers.filter((c) => c.status === 'PENDING_APPROVAL').length})
                      </button>
                      <button
                        onClick={() => setCustomerFilter('APPROVED')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          customerFilter === 'APPROVED'
                            ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Approved Customers ({customers.filter((c) => c.status === 'APPROVED').length})
                      </button>
                      <button
                        onClick={() => setCustomerFilter('REJECTED')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          customerFilter === 'REJECTED'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Rejected ({customers.filter((c) => c.status === 'REJECTED').length})
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative min-w-[220px]">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search name, phone..."
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Customer Queue Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Customer Name & Phone</th>
                            <th className="py-3 px-4">Registration Address</th>
                            <th className="py-3 px-4">Registered Date</th>
                            <th className="py-3 px-4">Account Status</th>
                            <th className="py-3 px-4 text-right">Approval Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredCustomers.map((cust) => (
                            <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900 block text-xs">{cust.full_name}</span>
                                <span className="text-[10px] text-slate-500 font-mono font-bold block">{cust.phone}</span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={cust.address}>
                                {cust.address || 'House / Road, Dhaka'}
                              </td>
                              <td className="py-3.5 px-4 text-[10px] text-slate-400 font-mono">
                                {new Date(cust.created_at).toLocaleDateString([], {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                    cust.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : cust.status === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {cust.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openCustomer360(cust)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                    title="View Customer 360 & Account History"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> History
                                  </button>

                                  {cust.status === 'PENDING_APPROVAL' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setApprovalModalTarget(cust);
                                          setApprovalDecision('APPROVED');
                                          setApprovalReason('Customer phone number verified via phone interview.');
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition shadow-sm"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          setApprovalModalTarget(cust);
                                          setApprovalDecision('REJECTED');
                                          setApprovalReason('Invalid address or unreachable contact number.');
                                        }}
                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {cust.status === 'APPROVED' && (
                                    <button
                                      onClick={() => {
                                        setApprovalModalTarget(cust);
                                        setApprovalDecision('REJECTED');
                                        setApprovalReason('Customer account suspended due to policy violation.');
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-[11px] font-bold transition"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredCustomers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400">
                                No customer accounts found in '{customerFilter}' queue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 7. STAFF AND AUDIT SECTION (SUPER ADMIN EXCLUSIVE) */}
          {/* ================================================================ */}
          {activeSection === 'staff' && (
            <div className="space-y-6">
              {!isSuperAdmin ? (
                <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-rose-900">
                    Restricted Area: Super Admin Role Required (HTTP 403 Forbidden)
                  </h3>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    Staff creation, status toggles, role assignments, and sensitive audit logs are strictly reserved for Super Administrators. Users cannot self-register as staff or modify roles.
                  </p>
                  <button
                    onClick={() => setActiveRole('SUPER_ADMIN')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Switch to Super Admin Simulator →
                  </button>
                </div>
              ) : (
                <>
                  {/* Sub-tabs */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <button
                        onClick={() => setStaffSubTab('staff')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          staffSubTab === 'staff'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        Staff Accounts ({staffList.length})
                      </button>
                      <button
                        onClick={() => setStaffSubTab('mfa')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          staffSubTab === 'mfa'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        MFA Dual Protection
                      </button>
                      <button
                        onClick={() => setStaffSubTab('audit')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          staffSubTab === 'audit'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        Sensitive Audit Logs ({auditLogs.length})
                      </button>
                    </div>

                    {staffSubTab === 'staff' && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" /> Invite Staff Member
                      </button>
                    )}
                  </div>

                  {/* 7a. Staff Management Sub-tab */}
                  {staffSubTab === 'staff' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Staff Member</th>
                            <th className="py-3 px-4">Assigned Role</th>
                            <th className="py-3 px-4">Account Status</th>
                            <th className="py-3 px-4">MFA State</th>
                            <th className="py-3 px-4">Last Login</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {staffList.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900 block">{st.full_name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{st.phone}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                                    st.role === 'SUPER_ADMIN'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : st.role === 'MODERATOR'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {st.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    st.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {st.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {st.mfa_enabled ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                                    <Lock className="w-3 h-3" /> Active
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Disabled</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-[10px] text-slate-400 font-mono">
                                {st.last_login_at ? new Date(st.last_login_at).toLocaleString() : 'Never'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {st.id !== user?.id && (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setStaffRoleModalTarget(st);
                                        setTargetNewRole(st.role);
                                        setTargetRoleReason('');
                                      }}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition"
                                    >
                                      Change Role
                                    </button>
                                    <button
                                      onClick={() => {
                                        setStaffStatusModalTarget(st);
                                        setTargetNewStatus(st.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED');
                                        setTargetStatusReason('');
                                      }}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition"
                                    >
                                      {st.status === 'APPROVED' ? 'Suspend' : 'Activate'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 7b. MFA Security Configuration Sub-tab */}
                  {staffSubTab === 'mfa' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Admin Multi-Factor Authentication (MFA)</h4>
                          <p className="text-xs text-slate-500">
                            Dual-layer defense for admin operations preventing unauthorized credential access.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">MFA Status on Current Session:</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> ENABLED & ENFORCED
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Admins and moderators must verify a 6-digit TOTP code during sign-in and sensitive role changes.
                        </p>
                      </div>

                      {mfaSecretData ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                          <h5 className="text-xs font-bold text-emerald-900">Authenticator Setup Initiated</h5>
                          <p className="text-[11px] text-emerald-700">
                            Enter the following secret into Google Authenticator or enter the verification code:
                          </p>
                          <div className="p-2 bg-white rounded-lg border border-emerald-300 font-mono text-center font-bold text-sm tracking-widest text-emerald-900">
                            {mfaSecretData.secret}
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-emerald-900 block">
                              6-Digit Verification Code (Demo Seed: {mfaSecretData.setupCode})
                            </label>
                            <input
                              type="text"
                              value={mfaCodeInput}
                              onChange={(e) => setMfaCodeInput(e.target.value)}
                              placeholder="654321"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-xl font-mono text-center font-bold text-lg"
                            />
                            <button
                              onClick={handleConfirmEnableMfa}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                            >
                              Verify & Activate MFA
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleInitiateMfa}
                          disabled={settingUpMfa}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
                        >
                          <Key className="w-4 h-4 text-emerald-400" /> Re-configure Authenticator Seed
                        </button>
                      )}
                    </div>
                  )}

                  {/* 7c. Sensitive Audit Logs Sub-tab */}
                  {staffSubTab === 'audit' && (
                    <div className="space-y-4">
                      {/* Search and filters */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-500 text-[11px] uppercase">Entity:</span>
                          <select
                            value={auditEntityFilter}
                            onChange={(e) => setAuditEntityFilter(e.target.value)}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="ALL">All Entities</option>
                            <option value="users">users</option>
                            <option value="hero_banners">hero_banners</option>
                            <option value="inventory_transactions">inventory_transactions</option>
                            <option value="inventory_alert_acknowledgments">inventory_alert_acknowledgments</option>
                            <option value="orders">orders</option>
                            <option value="products">products</option>
                          </select>
                        </div>

                        <div className="relative min-w-[200px]">
                          <input
                            type="text"
                            value={auditActionFilter}
                            onChange={(e) => setAuditActionFilter(e.target.value)}
                            placeholder="Filter by action (e.g. STAFF, MFA)..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      {/* Audit Table */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">Timestamp</th>
                                <th className="py-3 px-4">Actor</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Entity</th>
                                <th className="py-3 px-4">Audit Record Details (Sanitized)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {filteredAuditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </td>
                                  <td className="py-3 px-4">
                                    <strong className="block text-slate-900">{log.actor_name || 'System / Admin'}</strong>
                                    <span className="text-[10px] text-slate-400 font-mono">{log.actor_role || 'SUPER_ADMIN'}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                                    {log.entity_name}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-sm truncate" title={log.new_value}>
                                    {log.new_value || log.old_value || 'No value recorded'}
                                  </td>
                                </tr>
                              ))}
                              {filteredAuditLogs.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                                    No audit logs matching query.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALS */}
      {/* ==================================================================== */}

      {/* 1. View Order Details Modal */}
      {orderModalMode === 'details' && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Order Details: {selectedOrder.order_number || selectedOrder.orderNumber}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">TRK: {selectedOrder.tracking_number || selectedOrder.trackingNumber}</span>
              </div>
              <button onClick={() => setOrderModalMode(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 max-h-96 overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer & Delivery Snapshot</span>
                <div className="font-bold text-slate-900">{selectedOrder.customer_name || 'Customer'}</div>
                <div>{selectedOrder.phone}</div>
                <div className="text-slate-500 mt-1">{selectedOrder.shipping_address_snapshot || 'Dhaka, Bangladesh'}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Order Summary</span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Grand Total</span>
                  <span className="font-mono font-bold text-slate-900">৳{Number(selectedOrder.grand_total || selectedOrder.grandTotal || 0)} BDT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Payment Method</span>
                  <span className="font-mono font-bold">{selectedOrder.payment_method || selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Payment Status</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedOrder.payment_status || selectedOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Order Fulfillment Status</span>
                  <span className="font-bold text-blue-700">{selectedOrder.status}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOrderModalMode(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. Update Order Status Modal */}
      {orderModalMode === 'status' && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              Transition Status: {selectedOrder.order_number || selectedOrder.orderNumber}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Status</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Log Comment / Reason</label>
                <textarea
                  value={orderStatusComment}
                  onChange={(e) => setOrderStatusComment(e.target.value)}
                  rows={2}
                  placeholder="e.g. Courier consignment dispatched from Tejgaon warehouse"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderModalMode(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={updatingOrder}
                type="button"
                onClick={handleUpdateOrderStatus}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition"
              >
                {updatingOrder ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Printable Order Invoice Modal */}
      {orderModalMode === 'invoice' && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Liton Brothers Grocery</h2>
                <p className="text-xs text-slate-500">Dhaka, Bangladesh • Hotline: +880 1700-000000</p>
              </div>
              <button onClick={() => setOrderModalMode(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="grid grid-cols-2 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Invoice To:</span>
                <strong className="text-slate-900">{selectedOrder.customer_name || 'Customer'}</strong>
                <div>{selectedOrder.phone}</div>
                <div className="text-slate-500">{selectedOrder.shipping_address_snapshot}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Invoice Details:</span>
                <div className="font-mono font-bold text-slate-900">{selectedOrder.order_number || selectedOrder.orderNumber}</div>
                <div className="text-slate-500 font-mono text-[11px]">TRK: {selectedOrder.tracking_number || selectedOrder.trackingNumber}</div>
                <div className="text-slate-400 text-[11px] mt-1">{new Date(selectedOrder.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-3 text-xs flex justify-between font-bold text-slate-900">
              <span>Total Payable</span>
              <span className="font-mono text-base font-black text-emerald-700">
                ৳{Number(selectedOrder.grand_total || selectedOrder.grandTotal || 0).toFixed(2)} BDT
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
              <button
                onClick={() => setOrderModalMode(null)}
                className="py-2.5 px-4 border border-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Add New Product & Register Stock</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Teer Pure Mustard Oil"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="TEER-MUSTARD-500ML"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Price (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdBasePrice}
                    onChange={(e) => setNewProdBasePrice(Number(e.target.value))}
                    placeholder="180"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sale Price (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdSalePrice}
                    onChange={(e) => setNewProdSalePrice(Number(e.target.value))}
                    placeholder="165"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock (Ledger)</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    placeholder="piece / kg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdThreshold}
                    onChange={(e) => setNewProdThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image Thumbnail URL</label>
                <input
                  type="url"
                  value={newProdThumbnail}
                  onChange={(e) => setNewProdThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                ℹ️ Initial stock will automatically write to the immutable <code className="font-mono font-bold">inventory_transactions</code> ledger.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={savingProduct}
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  {savingProduct ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Product & Stock Adjustment Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 truncate pr-2">
                Edit {editingProduct.name}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Price (৳)</label>
                  <input
                    type="number"
                    value={editPriceBase}
                    onChange={(e) => setEditPriceBase(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sale Price (৳)</label>
                  <input
                    type="number"
                    value={editPriceSale}
                    onChange={(e) => setEditPriceSale(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Stock Quantity</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              {editStock !== Number(editingProduct.stock_quantity) && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">
                    Mandatory Reason for Stock Change (Audit Ledger) *
                  </label>
                  <textarea
                    required
                    value={editStockReason}
                    onChange={(e) => setEditStockReason(e.target.value)}
                    placeholder="e.g. Warehouse count reconciliation batch #891"
                    rows={2}
                    className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={savingProduct}
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  {savingProduct ? 'Saving...' : 'Save & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Alert Acknowledge Modal */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              Acknowledge Alert: {selectedAlertForAck.name || selectedAlertForAck.product_name}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                Item is currently at <strong>{selectedAlertForAck.stock_quantity || 0} units</strong> in stock.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Acknowledgment Note *</label>
                <textarea
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  placeholder="e.g. PO submitted to primary supplier, truck expected tomorrow."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAlertForAck(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={ackingAlert}
                onClick={handleAcknowledgeAlert}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition"
              >
                {ackingAlert ? 'Saving...' : 'Confirm Acknowledgment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Stock Adjustment Form Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Record Stock Movement (Ledger)</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Product *</label>
                <select
                  required
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Stock: {p.stock_quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Movement Type *</label>
                  <select
                    value={adjustType}
                    onChange={(e: any) => setAdjustType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="STOCK_IN">STOCK_IN (+)</option>
                    <option value="STOCK_OUT">STOCK_OUT (-)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (=)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-rose-700 block mb-1">
                  Mandatory Reason for Audit Log *
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received shipment from Teer Wholesale Hub batch #TH-902"
                  className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={adjustingStock}
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition"
                >
                  {adjustingStock ? 'Recording...' : 'Record to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Hero Banner Create / Edit Modal (With Live Visual Preview) */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
              </h3>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {/* Instant Live Preview of Banner */}
            <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
              <img
                src={bannerImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
                alt={bannerImageAlt}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex flex-col justify-between text-white">
                <span className="self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white">
                  {bannerTag || 'Campaign'}
                </span>
                <div>
                  <div className="text-xs font-black line-clamp-1">{bannerTitle || 'Your Headline Here'}</div>
                  <div className="text-[10px] text-slate-300 line-clamp-1">{bannerSubtitle || 'Subtitle text description...'}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Mega Friday Flash Deals — Up to 35% OFF"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle Description</label>
                <textarea
                  rows={2}
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="e.g. Premium edible oils and aromatic rice delivered to your door."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={bannerTag}
                    onChange={(e) => setBannerTag(e.target.value)}
                    placeholder="Friday Bazaar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Button Label</label>
                  <input
                    type="text"
                    value={bannerButtonText}
                    onChange={(e) => setBannerButtonText(e.target.value)}
                    placeholder="Shop now"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Image URL *</label>
                  <input
                    type="url"
                    required
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Image Alt Text (Accessibility)</label>
                  <input
                    type="text"
                    value={bannerImageAlt}
                    onChange={(e) => setBannerImageAlt(e.target.value)}
                    placeholder="Description for screen readers"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination Category</label>
                  <select
                    value={bannerCategory}
                    onChange={(e) => setBannerCategory(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="vegetables">Fresh Vegetables</option>
                    <option value="cooking-oil">Cooking Oil</option>
                    <option value="rice">Rice & Grains</option>
                    <option value="groceries">Groceries</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={bannerOrder}
                    onChange={(e) => setBannerOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={bannerStatus}
                    onChange={(e: any) => setBannerStatus(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date (Scheduling)</label>
                  <input
                    type="date"
                    value={bannerStartDate}
                    onChange={(e) => setBannerStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date (Scheduling)</label>
                  <input
                    type="date"
                    value={bannerEndDate}
                    onChange={(e) => setBannerEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={savingBanner}
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  {savingBanner ? 'Saving...' : 'Save & Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Delete Banner Confirmation Modal */}
      {deleteBannerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Delete Hero Banner?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove '{deleteBannerTarget.title || deleteBannerTarget.headline}' from database?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteBannerTarget(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBanner}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-md transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Customer 360 View Modal */}
      {customer360 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Customer 360: {customer360.customer?.fullName || customer360.customer?.full_name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {customer360.customer?.phone} • Status: {customer360.customer?.status}
                </span>
              </div>
              <button onClick={() => setCustomer360(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Registration Details</span>
                <div>Address: {customer360.customer?.address}</div>
                <div>Registered: {new Date(customer360.customer?.createdAt || customer360.customer?.created_at).toLocaleString()}</div>
                {customer360.customer?.rejectionReason && (
                  <div className="text-rose-700 font-bold mt-1">Rejection Reason: {customer360.customer?.rejectionReason}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status Audit History</span>
                {customer360.statusHistory?.map((h: any) => (
                  <div key={h.id} className="p-2 border-b border-slate-100 flex justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{h.action}</span>
                    <span className="text-slate-400 font-mono">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {(!customer360.statusHistory || customer360.statusHistory.length === 0) && (
                  <div className="text-slate-400 italic text-[11px]">No status transitions recorded yet.</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setCustomer360(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 11. Customer Approve / Reject Modal */}
      {approvalModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              {approvalDecision === 'APPROVED' ? 'Approve Customer Account' : 'Reject Customer Registration'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block">{approvalModalTarget.full_name}</strong>
                <span className="font-mono text-slate-500">{approvalModalTarget.phone}</span>
                <p className="text-slate-400 text-[11px] mt-1">{approvalModalTarget.address}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Recorded Reason & Audit Log Note *
                </label>
                <textarea
                  required
                  rows={2}
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  placeholder="e.g. Phone verification confirmed and NID address verified."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovalModalTarget(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={processingApproval}
                onClick={handleProcessApproval}
                className={`flex-1 py-2.5 text-white font-extrabold rounded-xl text-xs shadow-md transition ${
                  approvalDecision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processingApproval ? 'Processing...' : `Confirm ${approvalDecision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Invite Staff Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Invite New Staff Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleInviteStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Tariqul Islam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone (Bangladeshi 01X) *</label>
                <input
                  type="text"
                  required
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@litonbrothers.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Assignment</label>
                <input
                  type="text"
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="e.g. Assigned to order fulfillment desk"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                🔒 Staff account will be created directly by Super Admin. Passwords are never logged in audit files.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={invitingStaff}
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  {invitingStaff ? 'Inviting...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. Update Staff Role Modal */}
      {staffRoleModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              Update Role: {staffRoleModalTarget.full_name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Role</label>
                <select
                  value={targetNewRole}
                  onChange={(e) => setTargetNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="STAFF">STAFF</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Role Update *</label>
                <textarea
                  required
                  rows={2}
                  value={targetRoleReason}
                  onChange={(e) => setTargetRoleReason(e.target.value)}
                  placeholder="e.g. Promoted to operational inventory supervisor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStaffRoleModalTarget(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaffRole}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition"
              >
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. Update Staff Status Modal */}
      {staffStatusModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              Update Status: {staffStatusModalTarget.full_name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Status</label>
                <select
                  value={targetNewStatus}
                  onChange={(e) => setTargetNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="APPROVED">APPROVED (Active)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason *</label>
                <textarea
                  required
                  rows={2}
                  value={targetStatusReason}
                  onChange={(e) => setTargetStatusReason(e.target.value)}
                  placeholder="e.g. Temporary leave of absence"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStaffStatusModalTarget(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaffStatus}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition"
              >
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
