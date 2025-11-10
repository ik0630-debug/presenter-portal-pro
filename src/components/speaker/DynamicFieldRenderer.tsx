import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DynamicField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface DynamicFieldRendererProps {
  field: DynamicField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

export const DynamicFieldRenderer = ({ field, value, onChange }: DynamicFieldRendererProps) => {
  const handleChange = (newValue: any) => {
    onChange(field.id, newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {field.type === 'textarea' ? (
        <Textarea
          id={field.id}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className="min-h-[100px]"
        />
      ) : field.type === 'select' && field.options ? (
        <Select value={value || ''} onValueChange={handleChange}>
          <SelectTrigger id={field.id}>
            <SelectValue placeholder={field.placeholder || '선택하세요'} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.id}
          type={field.type}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )}
    </div>
  );
};
