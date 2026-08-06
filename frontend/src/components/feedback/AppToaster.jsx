import { Toaster } from 'sonner';

export default function AppToaster() {
  return <Toaster
    position="top-center"
    expand
    richColors={false}
    visibleToasts={3}
    gap={10}
    offset={76}
    mobileOffset={{ top: 72, left: 16, right: 16 }}
    containerAriaLabel="CodeMentor AI notifications"
    style={{ display: 'flex', justifyContent: 'center' }}
    toastOptions={{
      style: {
        width: 'min(420px, calc(100vw - 32px))',
        marginInline: 'auto'
      },
      classNames: {
        toast: '!flex !items-center !gap-3 !border !border-border !bg-surface !px-4 !py-3 !text-foreground !shadow-lg',
        content: '!min-w-0 !flex-1',
        title: '!text-sm !font-semibold !text-foreground',
        description: '!mt-0.5 !text-xs !leading-5 !text-muted-foreground',
        success: '!border-success/30',
        error: '!border-error/30',
        warning: '!border-warning/30',
        info: '!border-primary/30',
        actionButton: '!ml-auto !grid !h-8 !w-8 !shrink-0 !place-items-center !rounded-control !border !border-border !bg-surface !p-0 !text-muted-foreground !shadow-none hover:!bg-surface-secondary hover:!text-foreground focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-primary'
      }
    }}
  />;
}
