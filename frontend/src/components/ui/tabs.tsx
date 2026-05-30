import { type ReactNode, createContext, useContext, useState } from 'react';
import { cn } from '@/utils/cn';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  variant?: 'underline' | 'pill';
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  variant?: 'underline' | 'pill';
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, variant = 'underline', className, onValueChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const { variant } = useTabs();
  return (
    <div
      className={cn(
        'flex gap-1',
        variant === 'underline' && 'border-b border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab, setActiveTab, variant } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        'text-sm font-medium transition-colors whitespace-nowrap',
        variant === 'underline' && [
          'px-4 py-2.5 border-b-2 -mb-[1px]',
          isActive ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary',
        ],
        variant === 'pill' && [
          'px-4 py-2 rounded-md',
          isActive ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated',
        ],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab } = useTabs();
  if (activeTab !== value) return null;
  return <div className={cn('pt-4', className)}>{children}</div>;
}
