const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'src', 'components');
const primeVueComponents = new Set([
  'AutoComplete', 'CascadeSelect', 'Checkbox', 'CheckboxGroup', 'ColorPicker', 'DatePicker', 'InputOtp', 'Knob', 'Listbox', 'MultiSelect', 'Password', 'Rating', 'Select', 'SelectButton', 'Slider', 'Textarea', 'ToggleButton', 'ToggleSwitch', 'TreeSelect', 'SpeedDial', 'SplitButton', 'DataTable', 'Column', 'ColumnGroup', 'Row', 'DataView', 'OrderList', 'OrganizationChart', 'Paginator', 'PickList', 'Timeline', 'Tree', 'TreeTable', 'VirtualScroller', 'Accordion', 'AccordionPanel', 'AccordionHeader', 'AccordionContent', 'Card', 'Divider', 'Fieldset', 'Panel', 'ScrollPanel', 'Splitter', 'SplitterPanel', 'Stepper', 'StepList', 'StepPanels', 'StepItem', 'Step', 'StepPanel', 'Tabs', 'TabList', 'Tab', 'TabPanels', 'TabPanel', 'Toolbar', 'ConfirmDialog', 'ConfirmPopup', 'Dialog', 'Drawer', 'DynamicDialog', 'Popover', 'Breadcrumb', 'ContextMenu', 'Dock', 'Menu', 'Menubar', 'MegaMenu', 'PanelMenu', 'TieredMenu', 'Badge', 'Message', 'Carousel', 'Galleria', 'Image', 'ImageCompare', 'Avatar', 'AvatarGroup', 'OverlayBadge', 'BlockUI', 'Chip', 'MeterGroup', 'ProgressBar', 'ProgressSpinner', 'ScrollTop', 'Skeleton', 'Tag', 'Terminal', 'Chips', 'InputText', 'InputNumber', 'Button', 'InputGroup', 'InputGroupAddon', 'Tooltip', 'FloatLabel', 'IconField', 'InputIcon', 'FileUpload'
]);

const localComponents = new Set(
  fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.vue'))
    .map(f => f.replace('.vue', ''))
);
localComponents.add('TransitionFade');
localComponents.add('AnimateFade');

let totalMissing = 0;

function checkFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const tagRegex = /<([A-Z][a-zA-Z0-9]*)\b/g;
  let match;
  const usedComponents = new Set();
  
  while ((match = tagRegex.exec(content)) !== null) {
    usedComponents.add(match[1]);
  }
  
  const componentName = path.basename(filePath, '.vue');
  usedComponents.delete(componentName);
  
  const missing = [];
  usedComponents.forEach(tag => {
    if (primeVueComponents.has(tag) || localComponents.has(tag)) {
      // Check if there is an import for this tag
      const importRegex = new RegExp(`import\\s+(?:{\\s*)?${tag}(?:\\s*})?\\s+from`);
      if (!importRegex.test(content)) {
        missing.push(tag);
      }
    }
  });
  
  if (missing.length > 0) {
    console.log(`[!] ${componentName} is missing imports for: ${missing.join(', ')}`);
    totalMissing += missing.length;
    
    // Add them!
    const scriptSetupRegex = /<script\s+setup[^>]*>/;
    if (scriptSetupRegex.test(content)) {
        const importsToAdd = [];
        missing.forEach(tag => {
            if (primeVueComponents.has(tag)) {
                importsToAdd.push(`import ${tag} from 'primevue/${tag.toLowerCase()}';`);
            } else if (localComponents.has(tag)) {
                if (tag === 'TransitionFade') {
                    importsToAdd.push(`import TransitionFade from './TransitionFade.vue';`);
                } else if (tag === 'AnimateFade') {
                    importsToAdd.push(`import AnimateFade from './Animations/AnimateFade.vue';`);
                } else {
                    importsToAdd.push(`import ${tag} from './${tag}.vue';`);
                }
            }
        });
        const newContent = content.replace(scriptSetupRegex, match => `${match}\n    ${importsToAdd.join('\n    ')}`);
        fs.writeFileSync(filePath, newContent);
        console.log(`    -> Automatically added!`);
    } else {
        console.log(`    -> NO SCRIPT SETUP BLOCK FOUND!`);
    }
  }
}

fs.readdirSync(componentsDir).forEach(file => {
  if (file.endsWith('.vue')) {
    checkFile(path.join(componentsDir, file));
  }
});
console.log(`Total missing fixed: ${totalMissing}`);
