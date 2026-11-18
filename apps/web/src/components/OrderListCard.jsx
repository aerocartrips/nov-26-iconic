import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  formatINR,
  ORDER_STATUS_STYLES,
  formatOrderDate,
  orderDisplayId,
} from '@/lib/orders';

const OrderListCard = ({ order, detailPath, showCustomer = false }) => (
  <Link
    to={detailPath}
    className="block border border-border rounded-xl p-5 hover:border-gold transition-colors"
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-medium text-primary">{orderDisplayId(order)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatOrderDate(order.created)}
          {' · '}
          {(order.total_quantity || 0)} pieces
          {showCustomer && order.customer_email ? (
            <>
              {' · '}
              <span className="text-foreground/80">{order.customer_email}</span>
            </>
          ) : null}
        </p>
        {showCustomer && order.customer_name ? (
          <p className="text-xs text-muted-foreground mt-0.5">{order.customer_name}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium ${
            ORDER_STATUS_STYLES[order.status] || 'bg-secondary text-muted-foreground'
          }`}
        >
          {order.status}
        </span>
        <span className="font-display text-lg text-primary">{formatINR(order.amount_in_paise)}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  </Link>
);

export default OrderListCard;
