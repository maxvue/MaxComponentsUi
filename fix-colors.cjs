const fs = require('fs');
const path = require('path');

function replaceInFile(file, regex, replacement) {
    const filePath = path.join('/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix3-implementation/src/components', file);
    if (!fs.existsSync(filePath)) {
        console.log('Not found:', filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
}

replaceInFile('MaxAccordionItem.vue', /(&\.max-accordion-item-header-disabled\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxChips.vue', /(&::placeholder\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxTableFields.vue', /(\.max-table-fields-empty-cell\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('base/MaxBaseInput.vue', /(&::placeholder\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxInputTextArea.vue', /(&::placeholder\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxInputAutoComplete.vue', /(\.autocomplete-item-select-sub-label\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxInputAutoCompleteApi.vue', /(\.autocomplete-item-select-sub-label\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxInputDatePicker.vue', /(\.max-datepicker-weekdays\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');

// MaxInputOTP
replaceInFile('MaxInputOTP.vue', /(\.max-input-otp-separator\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxInputOTP.vue', /(&::placeholder\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxInputOTP.vue', /(&:disabled\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');

replaceInFile('MaxListBox.vue', /(\.max-listbox-item-sublabel\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxTabItem.vue', /(&\[disabled\]\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxEmptyDiv.vue', /(\.max-empty-div\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxEmptyDiv.vue', /(\.icon-div\s*\{\s*color:\s*var\(--background-)700(\);)/g, '$1650$2');
replaceInFile('MaxSideMenuMobile.vue', /(\.mobile-app-version\s*\{\s*[\s\S]*?color:\s*var\(--background-)700(\);)/g, '$1650$2');

console.log('Colors replaced!');
