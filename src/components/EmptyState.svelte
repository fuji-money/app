<script lang="ts">
  export let type = 'assets';

  const dict = (type: string) => {
    switch (type) {
      case 'assets':
        return {
          message: 'No assets yet',
          image: {
            top: 'cloud-3',
            bottom: 'cloud-2',
          },
        };
      case 'contracts':
        return {
          message: 'No contracts yet',
          image: {
            top: 'cloud-1',
            bottom: 'cloud-2',
          },
        };
      case 'activities':
        return {
          message: 'No activities yet',
          image: {
            top: 'cloud-3',
            bottom: 'illustration-3',
          },
        };
      case 'wallet':
        return {
          message: 'Please connect your wallet',
          image: {
            top: 'cloud-3',
            bottom: 'illustration-3',
          },
        };
      default:
        return {
          message: 'Nothing yet',
          image: {
            top: 'cloud-1',
            bottom: 'cloud-2',
          },
        };
    }
  };

  const message = dict(type).message;
  const topImage = dict(type).image.top;
  const topImageUrl = `/images/${topImage}.svg`;
  const bottomImage = dict(type).image.bottom;
  const bottomImageUrl = `/images/${bottomImage}.svg`;
</script>

<div
  class="empty-state is-flex if-flex-direction-column is-justify-content-center is-align-items-center"
>
  <img src={topImageUrl} alt="" class={topImage} />
  <p>{message}</p>
  <img src={bottomImageUrl} alt="" class={bottomImage} />
</div>

<style lang="scss">
  .empty-state {
    background-color: #fefefe;
    box-shadow: 0px 4px 12px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    height: 200px;
    margin: 20px 0;
    p {
      color: #94227d;
      font-weight: 700;
    }
    .cloud-1,
    .cloud-3 {
      position: relative;
      left: -260px;
      top: -60px;
      height: 48px;
    }
    .cloud-2 {
      position: relative;
      left: 260px;
      top: 60px;
      height: 40px;
    }
    .illustration-3 {
      position: relative;
      left: 280px;
      top: 50px;
      height: 100px;
    }
  }
</style>
