<template>
  <span class="icon is-small">
    <i class="far fa-square"></i>
    <span class="icon-number-square">1</span>
  </span>
</template>

<script>
export default {
  name: 'icon-unit-square',
};
</script>

<style scoped>
.icon.is-small {
  font-size: 1rem; /* adjust as needed to increase the size of the circle */
  margin-right: 0;
}


.icon-number-square {
  position: absolute;
  font-size: 0.8em; /* adjust as needed */
}
</style>
