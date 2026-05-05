import { useState, useCallback } from "react";
 
/**
 * usePrint hook
 * Sets the order to be printed, then calls window.print().
 *
 * Usage:
 *   const { printOrder, orderToPrint, clearPrint } = usePrint();
 *
 *   // Trigger print:
 *   <button onClick={() => printOrder(order)}>Print</button>
 *
 *   // Mount ticket (in JSX):
 *   <KitchenTicket order={orderToPrint} />
 */
export default function usePrint() {
  const [orderToPrint, setOrderToPrint] = useState(null);
  const [printVariant, setPrintVariant] = useState("kitchen");
 
  const printKitchen = useCallback((order) => {
    setOrderToPrint(order);
    setPrintVariant("kitchen");
    // Small delay to allow React to render the ticket before printing
    setTimeout(() => {
      window.print();
    }, 150);
  }, []);

  const printDelivery = useCallback((order) => {
    setOrderToPrint(order);
    setPrintVariant("delivery");
    setTimeout(() => {
      window.print();
    }, 150);
  }, []);
 
  const clearPrint = useCallback(() => {
    setOrderToPrint(null);
  }, []);
 
  return { printKitchen, printDelivery, orderToPrint, printVariant, clearPrint };
}
