import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 모바일 친화적인 반응형 테이블 컴포넌트
 * 작은 화면에서는 카드 레이아웃으로 전환됨
 */

const ResponsiveTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));
ResponsiveTable.displayName = 'ResponsiveTable';

const ResponsiveTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'hidden md:table-header-group [&_tr]:border-b',
      className
    )}
    {...props}
  />
));
ResponsiveTableHeader.displayName = 'ResponsiveTableHeader';

const ResponsiveTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      'block md:table-row-group [&_tr:last-child]:border-0',
      className
    )}
    {...props}
  />
));
ResponsiveTableBody.displayName = 'ResponsiveTableBody';

const ResponsiveTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'block md:table-row border-b transition-colors',
      'hover:bg-muted/50 data-[state=selected]:bg-muted',
      'mb-4 md:mb-0 border md:border-b rounded-lg md:rounded-none p-4 md:p-0',
      className
    )}
    {...props}
  />
));
ResponsiveTableRow.displayName = 'ResponsiveTableRow';

const ResponsiveTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground',
      '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
));
ResponsiveTableHead.displayName = 'ResponsiveTableHead';

const ResponsiveTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    mobileLabel?: string;
  }
>(({ className, mobileLabel, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'block md:table-cell p-2 md:p-4 align-middle',
      '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      'before:content-[attr(data-label)] before:font-semibold before:mr-2',
      'md:before:content-none',
      className
    )}
    data-label={mobileLabel}
    {...props}
  >
    {children}
  </td>
));
ResponsiveTableCell.displayName = 'ResponsiveTableCell';

const ResponsiveTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
ResponsiveTableCaption.displayName = 'ResponsiveTableCaption';

export {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHead,
  ResponsiveTableCell,
  ResponsiveTableCaption,
};
