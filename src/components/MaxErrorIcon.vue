<template>
    <div class="icon-error-max" color-red-b-575 >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
            <path d="M0 0h512v512H0z" fill="none" />
            <path fill="currentColor" fill-rule="evenodd" d="M256 42.667c117.803 0 213.334 95.53 213.334 213.333S373.803 469.334 256 469.334S42.667 373.803 42.667 256S138.197 42.667 256 42.667m48.918 134.25L256 225.836l-48.917-48.917l-30.165 30.165L225.835 256l-48.917 48.918l30.165 30.165L256 286.166l48.918 48.917l30.165-30.165L286.166 256l48.917-48.917z" />
        </svg>

    </div>
</template>

<script setup lang="ts" vapor>

</script>

<style lang="scss">
.icon-error-max {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    position: relative;

    &::before {
        position: absolute;
        content: '';
        width: 15px;
        height: 15px;
        background-color: white;
        border-radius: 50%;
        box-shadow: 0 0 10px 5px rgb(0 0 0 / 15%);
    }

    svg {
        // z-index: 1;
    }
}
</style>
