import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import OrderCard from "@/components/orders/OrderCard";
import { Button } from "@/components/ui/button";
import { OrderStatus, Order } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { QUERY_CATEGORIES } from "@/lib/query-cache-config";
import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";
import { SwipeableTabs } from "@/components/ui/swipeable-tabs";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");

  const {
    data: orders = [],
    isLoading,
    refetch,
    isError,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn({
      on401: "throw",
      retries: 2,
      timeout: 8000,
      category: "ORDERS",
    }),
    staleTime: QUERY_CATEGORIES.ORDERS.staleTime,
    gcTime: QUERY_CATEGORIES.ORDERS.gcTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Filter orders based on current tab
  const getFilteredOrders = (filterType: OrderStatus | "ALL") => {
    return filterType === "ALL"
      ? orders
      : orders.filter((order) => order.status === filterType);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    await refetch();
  };

  // Define tabs for swipeable interface
  const tabs = [
    {
      id: "all",
      label: "All Orders",
      content: (
        <PullToRefresh
          onRefresh={handleRefresh}
          className="min-h-[300px]"
          loadingIndicator={
            <div className="w-full flex justify-center items-center h-14">
              <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground mt-1">
                  Refreshing...
                </span>
              </div>
            </div>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderOrdersList(getFilteredOrders("ALL"), isLoading)}
          </motion.div>
        </PullToRefresh>
      ),
    },
    {
      id: "in-progress",
      label: "In Progress",
      content: (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-[300px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderOrdersList(
              getFilteredOrders(OrderStatus.IN_PROGRESS),
              isLoading,
            )}
          </motion.div>
        </PullToRefresh>
      ),
    },
    {
      id: "completed",
      label: "Completed",
      content: (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-[300px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderOrdersList(
              getFilteredOrders(OrderStatus.COMPLETED),
              isLoading,
            )}
          </motion.div>
        </PullToRefresh>
      ),
    },
    {
      id: "cancelled",
      label: "Cancelled",
      content: (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-[300px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderOrdersList(
              getFilteredOrders(OrderStatus.CANCELLED),
              isLoading,
            )}
          </motion.div>
        </PullToRefresh>
      ),
    },
  ];

  // Map filter string to tab index for two-way state binding
  const filterToTabIndex: Record<OrderStatus | "ALL", number> = {
    ALL: 0,
    [OrderStatus.IN_PROGRESS]: 1,
    [OrderStatus.COMPLETED]: 2,
    [OrderStatus.CANCELLED]: 3,
  };

  const tabIndexToFilter = [
    "ALL",
    OrderStatus.IN_PROGRESS,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ] as const;

  return (
    <div className="h-screen-minus-tab overflow-y-auto flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-5 flex items-center">
          <Logo size="sm" className="mr-3" />
          <div>
            <h1 className="text-2xl font-bold autofill-navy">My Orders</h1>
            <p className="text-sm text-neutral-500">
              Track your fuel deliveries
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Swipeable Tabs Implementation */}
        <SwipeableTabs
          tabs={tabs}
          defaultTabIndex={filterToTabIndex[filter]}
          onTabChange={(index) => setFilter(tabIndexToFilter[index])}
          tabsClassName="bg-white rounded-xl p-1"
          contentClassName="mt-4"
        />
      </div>

      <div className="mt-auto p-4 bg-white border-t">
        <Link href="/order">
          <Button className="w-full bg-autofill-orange text-white hover:bg-orange-500 font-medium py-5">
            Place New Order
          </Button>
        </Link>
      </div>
    </div>
  );
}

function renderOrdersList(orders: Order[], isLoading: boolean) {
  // Show a nice loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden animate-pulse"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>

              <div className="mt-4 flex justify-between">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state when no orders exist
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 mb-4 py-10 text-center">
        <Logo size="sm" className="mx-auto mb-4" />
        <p className="text-neutral-500 mb-4">
          You haven't placed any fuel orders yet
        </p>
        <Link href="/order">
          <Button className="mx-auto bg-autofill-orange text-white hover:bg-orange-500">
            Order Fuel Now
          </Button>
        </Link>
      </div>
    );
  }

  // Render the list of orders
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} showViewDetails={true} />
      ))}
    </div>
  );
}
