/* eslint-disable prefer-const */
import { Pool } from '../../types/schema'
import { Flash as FlashEvent } from '../../types/templates/Pool/Pool'
import { Pool as PoolABI } from '../../types/Factory/Pool'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleFlash(event: FlashEvent): void {
  //@TODO: Fill this in and create Flash events.
  // update fee growth
  let pool = Pool.load(event.address.toHexString())!
  let poolContract = PoolABI.bind(event.address)
  let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128()
  let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128()
  pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt
  pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt
  pool.save()
}
