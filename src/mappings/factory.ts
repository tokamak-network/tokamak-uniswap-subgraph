/* eslint-disable prefer-const */
import { BigInt, log } from '@graphprotocol/graph-ts'
import { ERC20 } from '../types/Factory/ERC20'
import { PoolCreated } from '../types/Factory/Factory'
import { Bundle, Factory, Pool, Token } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { fetchTokenTotalSupply } from '../utils/token'
import { ADDRESS_ZERO, FACTORY_ADDRESS, ONE_BI, ZERO_BD, ZERO_BI } from './../utils/constants'
import { WHITELIST_TOKENS } from './../utils/pricing'

export function handlePoolCreated(event: PoolCreated): void {
  // // temp fix
  // if (event.params.pool == Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248')) {
  //   return
  // }

  // load factory
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.poolCount = ZERO_BI
    factory.totalVolumeETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.volumeUSDUntracked = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesETH = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.totalValueLockedETHUntracked = ZERO_BD
    factory.txCount = ZERO_BI
    factory.owner = ADDRESS_ZERO

    // create new bundle for tracking eth price
    let bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()
  }

  factory.poolCount = factory.poolCount.plus(ONE_BI)

  let pool = new Pool(event.params.pool.toHexString()) as Pool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    let endpoint = ERC20.bind(event.params.token0)
    let name = endpoint.try_name()
    let symbol = endpoint.try_symbol()
    let decimals = endpoint.try_decimals()
    token0.symbol = symbol.reverted ? 'unknown' : symbol.value
    token0.name = name.reverted ? 'unknown' : name.value
    token0.decimals = decimals.reverted ? BigInt.fromI32(18) : BigInt.fromI32(decimals.value)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token0.derivedETH = ZERO_BD
    token0.volume = ZERO_BD
    token0.volumeUSD = ZERO_BD
    token0.volumeUSDUntracked = ZERO_BD
    token0.feesUSD = ZERO_BD
    token0.totalValueLocked = ZERO_BD
    token0.totalValueLockedUSD = ZERO_BD
    token0.totalValueLockedUSDUntracked = ZERO_BD
    token0.txCount = ZERO_BI
    token0.poolCount = ZERO_BI
    token0.whitelistPools = []
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    let endpoint = ERC20.bind(event.params.token1)
    let name = endpoint.try_name()
    let symbol = endpoint.try_symbol()
    let decimals = endpoint.try_decimals()
    token1.symbol = symbol.reverted ? 'unknown' : symbol.value
    token1.name = name.reverted ? 'unknown' : name.value
    token1.decimals = decimals.reverted ? BigInt.fromI32(18) : BigInt.fromI32(decimals.value)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.derivedETH = ZERO_BD
    token1.volume = ZERO_BD
    token1.volumeUSD = ZERO_BD
    token1.volumeUSDUntracked = ZERO_BD
    token1.feesUSD = ZERO_BD
    token1.totalValueLocked = ZERO_BD
    token1.totalValueLockedUSD = ZERO_BD
    token1.totalValueLockedUSDUntracked = ZERO_BD
    token1.txCount = ZERO_BI
    token1.poolCount = ZERO_BI
    token1.whitelistPools = []
  }

  // update white listed pools
  if (WHITELIST_TOKENS.includes(token0.id)) {
    let newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }
  if (WHITELIST_TOKENS.includes(token1.id)) {
    let newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.liquidityProviderCount = ZERO_BI
  pool.txCount = ZERO_BI
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.feeGrowthGlobal0X128 = ZERO_BI
  pool.feeGrowthGlobal1X128 = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.observationIndex = ZERO_BI
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.totalValueLockedETH = ZERO_BD
  pool.totalValueLockedUSDUntracked = ZERO_BD
  pool.totalValueLockedETHUntracked = ZERO_BD
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.volumeUSDUntracked = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
  factory.save()
}
