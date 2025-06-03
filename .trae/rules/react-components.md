---
description: React组件开发规则和UI最佳实践
globs: ["src/ui/**/*.tsx", "src/app/**/*.tsx"]
alwaysApply: true
---

# React组件开发规则

## 组件结构规范

### 文件组织

```
src/ui/components/
├── common/              # 通用组件
│   ├── Button/
│   │   ├── index.tsx
│   │   ├── Button.tsx
│   │   └── Button.module.css
│   └── Modal/
├── forms/               # 表单组件
├── layout/              # 布局组件
└── domain-specific/     # 业务特定组件
    ├── image-edit/
    ├── payments/
    └── user-profile/
```

### 组件命名规范

1. **组件文件**: PascalCase

   ```typescript
   // ✅ 推荐
   ImageEditor.tsx
   PaymentForm.tsx
   UserProfile.tsx
   
   // ❌ 避免
   imageEditor.tsx
   payment-form.tsx
   ```

2. **组件导出**: 默认导出组件，命名导出类型

   ```typescript
   // Button.tsx
   export interface ButtonProps {
     variant: 'primary' | 'secondary';
     children: React.ReactNode;
   }
   
   export default function Button({ variant, children }: ButtonProps) {
     return <button className={`btn btn-${variant}`}>{children}</button>;
   }
   ```

## 组件设计原则

### 1. 单一职责原则

```typescript
// ✅ 好的设计 - 职责单一
function ImageThumbnail({ src, alt, size }: ImageThumbnailProps) {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`thumbnail thumbnail-${size}`}
    />
  );
}

function ImageActions({ onEdit, onDelete }: ImageActionsProps) {
  return (
    <div className="image-actions">
      <Button onClick={onEdit}>编辑</Button>
      <Button onClick={onDelete} variant="danger">删除</Button>
    </div>
  );
}

// ❌ 避免 - 职责混合
function ImageCard({ src, alt, onEdit, onDelete, showActions }: ImageCardProps) {
  // 混合了显示和操作逻辑
}
```

### 2. 组合优于继承

```typescript
// ✅ 使用组合
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return <div className={`card ${className || ''}`}>{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
}

// 使用
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <h3>{user.name}</h3>
      </CardHeader>
      <CardBody>
        <p>{user.email}</p>
      </CardBody>
    </Card>
  );
}
```

### 3. Props接口设计

```typescript
// ✅ 清晰的Props接口
interface ButtonProps {
  // 必需属性
  children: React.ReactNode;
  
  // 可选属性
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  
  // 事件处理
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  // HTML属性
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'data-testid'?: string;
}

// 扩展HTML属性
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}
```

## 状态管理

### 1. 本地状态

```typescript
// ✅ 简单状态
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}

// ✅ 复杂状态使用useReducer
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction = 
  | { type: 'SET_VALUE'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error }
      };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'RESET':
      return { values: {}, errors: {}, isSubmitting: false };
    default:
      return state;
  }
}
```

### 2. 状态提升

```typescript
// ✅ 状态提升到共同父组件
function ImageGallery() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  
  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };
  
  return (
    <div>
      <ImageGrid 
        images={images}
        selectedImages={selectedImages}
        onImageSelect={handleImageSelect}
      />
      <ImageActions 
        selectedImages={selectedImages}
        onBulkDelete={() => {/* 批量删除 */}}
      />
    </div>
  );
}
```

## 性能优化

### 1. React.memo

```typescript
// ✅ 使用React.memo优化重渲染
interface ImageItemProps {
  image: Image;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const ImageItem = React.memo(function ImageItem({ 
  image, 
  onSelect, 
  isSelected 
}: ImageItemProps) {
  const handleClick = useCallback(() => {
    onSelect(image.id);
  }, [image.id, onSelect]);
  
  return (
    <div 
      className={`image-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <img src={image.thumbnail} alt={image.alt} />
    </div>
  );
});
```

### 2. useMemo和useCallback

```typescript
function ExpensiveComponent({ items, filter }: Props) {
  // ✅ 缓存计算结果
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);
  
  // ✅ 缓存事件处理函数
  const handleItemClick = useCallback((itemId: string) => {
    // 处理点击
  }, []);
  
  return (
    <div>
      {filteredItems.map(item => (
        <ItemComponent 
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
}
```

### 3. 虚拟化长列表

```typescript
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  height: number;
}

function VirtualizedList({ items, itemHeight, height }: VirtualizedListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
    >
      {Row}
    </List>
  );
}
```

## 错误处理

### 1. 错误边界

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出现了错误</h2>
          <p>请刷新页面重试</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 2. 异步错误处理

```typescript
function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);
  
  const throwError = useCallback((error: Error) => {
    setError(error);
  }, []);
  
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return throwError;
}

// 使用
function AsyncComponent() {
  const throwError = useAsyncError();
  
  const handleAsyncOperation = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      throwError(error as Error);
    }
  };
  
  return <button onClick={handleAsyncOperation}>执行操作</button>;
}
```

## 表单处理

### 1. 受控组件

```typescript
interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const handleChange = (field: keyof FormData) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value
      }));
      
      // 清除错误
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 验证
    const newErrors: Partial<FormData> = {};
    if (!formData.email) newErrors.email = '邮箱不能为空';
    if (!formData.password) newErrors.password = '密码不能为空';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 提交
    try {
      await submitForm(formData);
    } catch (error) {
      console.error('提交失败:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        placeholder="邮箱"
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        placeholder="密码"
      />
      {errors.password && <span className="error">{errors.password}</span>}
      
      <button type="submit">登录</button>
    </form>
  );
}
```

### 2. React Hook Form集成

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function OptimizedForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
    } catch (error) {
      console.error('提交失败:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <input
            {...field}
            type="email"
            placeholder="邮箱"
            className={errors.email ? 'error' : ''}
          />
        )}
      />
      {errors.email && <span className="error">{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '登录'}
      </button>
    </form>
  );
}
```

## 样式和主题

### 1. CSS Modules

```typescript
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.primary {
  background-color: var(--color-primary);
  color: white;
}

.secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}

// Button.tsx
import styles from './Button.module.css';

function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button 
      className={`${styles.button} ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 2. Tailwind CSS

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 测试

### 1. 组件测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies correct variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('btn-danger');
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

### 2. Hook测试

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });
  
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## 最佳实践总结

1. **组件设计**:
   - 保持组件小而专注
   - 使用组合而非继承
   - 明确的Props接口

2. **性能优化**:
   - 合理使用React.memo
   - 缓存计算和回调
   - 虚拟化长列表

3. **状态管理**:
   - 本地状态优先
   - 状态提升到合适层级
   - 复杂状态使用useReducer

4. **错误处理**:
   - 使用错误边界
   - 优雅的错误显示
   - 异步错误处理

5. **可访问性**:
   - 语义化HTML
   - 键盘导航支持
   - 屏幕阅读器友好

6. **测试**:
   - 单元测试覆盖
   - 集成测试关键流程
   - 可访问性测试

---

遵循这些React组件开发规则可以创建可维护、高性能、用户友好的UI组件。
