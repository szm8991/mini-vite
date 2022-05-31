<template>
  <div class="wrapper">
    <h1 class="red">{{title}}</h1>
  </div>
</template>

<script>
import { reactive, toRefs } from "vue";

export default {
  setup() {
    const state = reactive({
      title: "hello kvite!",
    });
    return {
      ...toRefs(state),
    };
  },
};
</script>
<style scoped>
.wrapper {
  height: 400px;
  width: 400px;
  border: 1px solid red;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}
.red {
  color: red;
}
</style>
