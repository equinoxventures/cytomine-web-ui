<template>
  <span class="icon is-small">
    <i class="far fa-circle"></i>
    <span class="icon-number-circle">1</span>
  </span>
</template>

<script>
export default {
  name: 'Icon-unit-circle',
};
</script>

<style scoped>
.icon.is-small {
  font-size: 1rem; /* adjust as needed to increase the size of the circle */
  margin-right: 0;
}


.icon-number-circle {
  position: absolute;
  font-size: 0.8em; /* adjust as needed */
}
</style>
